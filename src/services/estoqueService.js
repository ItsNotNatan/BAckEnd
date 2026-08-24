// =================================================================
// ARQUIVO: src/services/estoqueService.js
// DESCRIÇÃO: Serviço de comunicação do Estoque com a Base de Dados
// =================================================================
const supabase = require('../config/supabase');

const listarEstoqueGeral = async (filial = '', incluirZerados = false) => {
  let query = supabase.from('estoque').select('*');
  
  if (!incluirZerados) {
    query = query.gt('quantidade_disponivel', 0);
  }
  
  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_id', filial);
  }
  
  const { data, error } = await query.order('part_number', { ascending: true });
  if (error) throw error;

  // ✨ MÁGICA DOS ITENS RESERVADOS: Procura o que está pendente de sair!
  const { data: itensPendentes, error: erroPendentes } = await supabase
    .from('solicitacoes_itens')
    .select(`
      estoque_id, 
      quantidade_solicitada,
      solicitacoes!inner(status, tipo)
    `)
    .eq('solicitacoes.status', 'Pendente')
    // Apenas pedidos que vão RETIRAR material do estoque entram como reserva:
    .in('solicitacoes.tipo', ['Material', 'Transferencia WBS', 'Transfer. WBS']); 

  if (erroPendentes) {
    console.error('[Erro ao buscar reservas]:', erroPendentes);
  }

  // Cria um "dicionário" onde a chave é o ID da prateleira e o valor é a soma do que está pendente
  const mapaReservas = {};
  if (itensPendentes) {
    itensPendentes.forEach(it => {
      if (it.estoque_id) {
        mapaReservas[it.estoque_id] = (mapaReservas[it.estoque_id] || 0) + Number(it.quantidade_solicitada || 0);
      }
    });
  }

  // Adiciona o campo "quantidade_reservada" a cada item do estoque antes de enviar para o Frontend
  const estoqueFinal = data.map(item => ({
    ...item,
    quantidade_reservada: mapaReservas[item.id] || 0
  }));

  return estoqueFinal;
};

// ✨ NOVA FUNÇÃO: Atualiza os dados e regista as alterações no histórico
const atualizarItemEstoque = async (id, dadosAtualizados) => {
  // 1. Extraímos quem fez a edição (enviado pelo Frontend)
  const usuarioEditor = dadosAtualizados.usuario_editor || 'Sistema';
  delete dadosAtualizados.usuario_editor;

  // 2. Buscamos o valor atual no banco para comparar
  const { data: itemAntigo, error: erroBusca } = await supabase
    .from('estoque')
    .select('*')
    .eq('id', id)
    .single();

  if (erroBusca) throw erroBusca;

  // 3. Preparamos o histórico de tudo o que mudou
  const historico = [];
  for (const campo in dadosAtualizados) {
    const valorVelho = String(itemAntigo[campo] || '');
    const valorNovo = String(dadosAtualizados[campo] || '');

    if (valorVelho !== valorNovo) {
      historico.push({
        estoque_id: id,
        usuario: usuarioEditor,
        campo_alterado: campo,
        valor_antigo: valorVelho,
        valor_novo: valorNovo
      });
    }
  }

  // 4. Atualiza os dados na tabela oficial de estoque
  const { error } = await supabase
    .from('estoque')
    .update(dadosAtualizados)
    .eq('id', id);

  if (error) throw error;

  // 5. Salva o relatório de edições na tabela de histórico
  if (historico.length > 0) {
    await supabase.from('historico_edicoes').insert(historico);
  }

  return true;
};

module.exports = {
  listarEstoqueGeral,
  atualizarItemEstoque // ✨ Exportar a nova função
};