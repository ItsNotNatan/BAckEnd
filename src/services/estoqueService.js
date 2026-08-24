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
    // ✨ CORREÇÃO: Crossdocking adicionado à lista de saídas que reservam estoque!
    .in('solicitacoes.tipo', ['Material', 'Transferencia WBS', 'Transfer. WBS', 'Crossdocking']); 

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

// NOVA FUNÇÃO: Atualiza os dados e regista as alterações no histórico
const atualizarItemEstoque = async (id, dadosAtualizados) => {
  const usuarioEditor = dadosAtualizados.usuario_editor || 'Sistema';
  delete dadosAtualizados.usuario_editor;

  const { data: itemAntigo, error: erroBusca } = await supabase
    .from('estoque')
    .select('*')
    .eq('id', id)
    .single();

  if (erroBusca) throw erroBusca;

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

  const { error } = await supabase
    .from('estoque')
    .update(dadosAtualizados)
    .eq('id', id);

  if (error) throw error;

  if (historico.length > 0) {
    await supabase.from('historico_edicoes').insert(historico);
  }

  return true;
};

module.exports = {
  listarEstoqueGeral,
  atualizarItemEstoque 
};