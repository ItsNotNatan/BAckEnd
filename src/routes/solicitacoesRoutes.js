// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Importa a conexão com o banco

// ==========================================================
// 🚀 ROTA GET: Listar todas as solicitações para a tabela
// ==========================================================
router.get('/listar', async (req, res) => {
  try {
    // Buscamos todas as solicitações e incluímos o ID da tabela boletins_saida (se houver relacionamento)
    const { data: solicitacoes, error } = await supabase
      .from('solicitacoes')
      .select(`
        id,
        tipo,
        nome_solicitante,
        wbs_destino,
        wbs_origem,
        observacoes,
        data_necessidade,
        entrega_urgente,
        status,
        created_at,
        boletins_saida ( id )
      `)
      .order('created_at', { ascending: false }); // Traz as mais recentes primeiro

    if (error) throw error;

    // Tratamos e mapeamos os dados para facilitar a leitura no Front-end
    const dadosFormatados = solicitacoes.map(sol => ({
      id: sol.id,
      tipo: sol.tipo,
      solicitante: sol.nome_solicitante || 'Não informado',
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      // Se houver um boletim de saída vinculado, exibe o ID dele, senão retorna null
      bs: sol.boletins_saida ? `BS #${sol.boletins_saida.id}` : null,
      dataSolicitacao: new Date(sol.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(sol.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataEntrega: sol.status === 'Concluído' ? 'Disponível' : null,
      status: sol.status,
      entregaUrgente: sol.entrega_urgente
    }));

    res.status(200).json({ sucesso: true, dados: dadosFormatados });

  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
});

// ==========================================================
// 📥 ROTA POST: Criar uma nova Solicitação (PS) e seus itens
// ==========================================================
router.post('/nova', async (req, res) => {
  const { solicitante, itens } = req.body;

  try {
    // 1. Gera um ID para a PS (ex: PS-20260706-1234)
    const psId = `PS-${Date.now()}`;

    // Captura o WBS de origem (se for transferência, pegamos do primeiro item selecionado)
    let wbsOrigem = null;
    if (solicitante.tipo === 'Transferencia WBS' && itens && itens.length > 0) {
       wbsOrigem = itens[0].wbsOrigem || itens[0].wbs || null;
    }

    // INTERCEPTADOR DO CANCELAMENTO: Evita quebrar o CHECK constraint do tipo de solicitação
    let tipoFinal = solicitante.tipo || 'Material';
    let statusFinal = 'Pendente';

    if (tipoFinal === 'Cancelado') {
      tipoFinal = 'Crossdocking'; // Associa ao fluxo logístico correto
      statusFinal = 'Cancelado';   // Salva no banco direto com a flag de cancelado
    }

    // 2. Insere a solicitação principal na tabela 'solicitacoes'
    const { error: erroPS } = await supabase
      .from('solicitacoes')
      .insert([{
        id: psId,
        tipo: tipoFinal, 
        nome_solicitante: solicitante.nome || solicitante.solicitante || 'Não informado',
        wbs_origem: wbsOrigem,                
        wbs_destino: solicitante.wbs || solicitante.wbs_destino || null,         
        destino: solicitante.destino || null,
        data_necessidade: solicitante.dataNecessidade || null,
        observacoes: solicitante.observacoes || '',
        entrega_urgente: solicitante.entregaUrgente || false,
        status: statusFinal
      }]);

    if (erroPS) throw erroPS;

    // 3. Prepara e Normaliza os itens (se houver) para inserir na tabela 'solicitacoes_itens'
    if (itens && itens.length > 0) {
      const itensParaInserir = itens.map(item => {
        
        // CONCATENAÇÃO INTELIGENTE: Agrupa dados extras do relatório SAP na descrição para não perder informação
        let descricaoCompilada = item.materialDescription || item.descricao || item.descricao_manual || 'Item sem descrição';
        
        const tagsExtras = [];
        if (item.alocacao) tagsExtras.push(`Aloc: ${item.alocacao}`);
        if (item.centro) tagsExtras.push(`Centro: ${item.centro}`);
        if (item.deposito) tagsExtras.push(`Dep: ${item.deposito}`);
        if (item.referencia) tagsExtras.push(`Ref: ${item.referencia}`);
        if (item.vendorDescription) tagsExtras.push(`Vendor: ${item.vendorDescription}`);
        
        if (tagsExtras.length > 0) {
          descricaoCompilada += ` (${tagsExtras.join(' | ')})`;
        }

        // Limpeza criptográfica de valores monetários (Ex: "R$ 1.697,39" -> 1697.39)
        const precoBruto = item.poNetPrice || item.valorUnit || item.valor_unitario_manual || 0;
        const precoLimpo = precoBruto 
          ? parseFloat(String(precoBruto).replace(/[^\d.,]/g, '').replace(',', '.')) 
          : 0;

        return {
          solicitacao_id: psId,
          desenho_sap_manual: item.desenhoSAP || item.desenho_sap_manual || null,
          part_number_manual: item.numPecaFabricante || item.partNumber || item.part_number_manual || null,
          descricao_manual: descricaoCompilada.substring(0, 255), // Garante o limite VARCHAR do banco
          quantidade_solicitada: parseFloat(item.qtdFornecida || item.qtdSelecionada || item.quantidade || item.qtd || 1), 
          unidade_medida_manual: item.unidadeMedida || item.unid || item.unidade || item.unidade_medida_manual || 'Unid',
          valor_unitario_manual: isNaN(precoLimpo) ? 0 : precoLimpo
        };
      });

      // 4. Salva todos os itens de uma vez só no Supabase (Bulk Insert)
      const { error: erroItens } = await supabase
        .from('solicitacoes_itens')
        .insert(itensParaInserir);

      if (erroItens) throw erroItens;
    }

    // Resposta de sucesso unificada
    res.status(201).json({ 
      sucesso: true, 
      mensagem: 'Solicitação processada e salva com sucesso!', 
      ps_id: psId 
    });

  } catch (error) {
    console.error('[Erro na API ao criar solicitação]:', error);
    res.status(500).json({ sucesso: false, erro: error.message || 'Falha ao salvar a solicitação no banco.' });
  }
});

module.exports = router;