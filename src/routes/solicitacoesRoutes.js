// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); 

// ==========================================================
// 🚀 ROTA GET: Listar todas as solicitações para a tabela
// ==========================================================
router.get('/listar', async (req, res) => {
  try {
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
      .order('created_at', { ascending: false });

    if (error) throw error;

    const dadosFormatados = solicitacoes.map(sol => ({
      id: sol.id,
      tipo: sol.tipo,
      solicitante: sol.nome_solicitante || 'Não informado',
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      bs: sol.boletins_saida && sol.boletins_saida.length > 0 ? `BS #${sol.boletins_saida[0].id}` : null,
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
// 📥 ROTA POST: Criar uma nova Solicitação (PS)
// ==========================================================
router.post('/nova', async (req, res) => {
  const { solicitante, itens } = req.body;

  try {
    // 1. Gera um ID para a PS
    const psId = `PS-${Date.now()}`;

    // Captura o WBS de origem
    let wbsOrigem = null;
    if (solicitante.tipo === 'Transferencia WBS' && itens && itens.length > 0) {
       wbsOrigem = itens[0].wbsOrigem || itens[0].wbs || null;
    }

    // INTERCEPTADOR DO CANCELAMENTO
    let tipoFinal = solicitante.tipo || 'Material';
    let statusFinal = 'Pendente';

    if (tipoFinal === 'Cancelado') {
      tipoFinal = 'Crossdocking'; 
      statusFinal = 'Cancelado';   
    }

    // Previne erro do Postgres caso a data venha vazia ("")
    const dataNecessidadeLimpa = solicitante.dataNecessidade ? solicitante.dataNecessidade : null;

    // 2. Insere a solicitação principal na tabela 'solicitacoes'
    const { error: erroPS } = await supabase
      .from('solicitacoes')
      .insert([{
        id: psId,
        usuario_id: null, // <-- DEIXAMOS NULL PARA TESTES, já que tiramos o token!
        tipo: tipoFinal, 
        nome_solicitante: solicitante.nome || solicitante.solicitante || 'Não informado',
        wbs_origem: wbsOrigem,                
        wbs_destino: solicitante.wbs || solicitante.wbs_destino || null,         
        destino: solicitante.destino || null,
        data_necessidade: dataNecessidadeLimpa,
        observacoes: solicitante.observacoes || '',
        entrega_urgente: solicitante.entregaUrgente || false,
        status: statusFinal
      }]);

    if (erroPS) throw erroPS;

    // 3. Prepara e Normaliza os itens
    if (itens && itens.length > 0) {
      const itensParaInserir = itens.map(item => {
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

        const precoBruto = item.poNetPrice || item.valorUnit || item.valor_unitario_manual || 0;
        const precoLimpo = precoBruto 
          ? parseFloat(String(precoBruto).replace(/[^\d.,]/g, '').replace(',', '.')) 
          : 0;

        // Garante que a quantidade seja no mínimo 1 para não quebrar o CHECK do banco
        const quantidadeGarantida = Math.max(1, parseFloat(item.qtdFornecida || item.qtdSelecionada || item.quantidade || item.qtd || 1));

        return {
          solicitacao_id: psId,
          desenho_sap_manual: item.desenhoSAP || item.desenho_sap_manual || null,
          part_number_manual: item.numPecaFabricante || item.partNumber || item.part_number_manual || null,
          descricao_manual: descricaoCompilada.substring(0, 255), 
          quantidade_solicitada: quantidadeGarantida, 
          unidade_medida_manual: item.unidadeMedida || item.unid || item.unidade || item.unidade_medida_manual || 'Unid',
          valor_unitario_manual: isNaN(precoLimpo) ? 0 : precoLimpo
        };
      });

      // 4. Salva todos os itens
      const { error: erroItens } = await supabase
        .from('solicitacoes_itens')
        .insert(itensParaInserir);

      if (erroItens) throw erroItens;
    }

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