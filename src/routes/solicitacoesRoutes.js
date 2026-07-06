// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Importa a conexão com o banco

// Rota POST: Criar uma nova Solicitação (PS) e seus itens
router.post('/nova', async (req, res) => {
  const { solicitante, itens } = req.body;

  try {
    // 1. Gera um ID para a PS (ex: PS-20260706-1234)
    const psId = `PS-${Date.now()}`;

    // Captura o WBS de origem (se for transferência, pegamos do primeiro item selecionado)
    let wbsOrigem = null;
    if (solicitante.tipo === 'Transferencia WBS' && itens.length > 0) {
       wbsOrigem = itens[0].wbsOrigem;
    }

    // 2. Insere a solicitação principal na tabela 'solicitacoes'
    const { error: erroPS } = await supabase
      .from('solicitacoes')
      .insert([{
        id: psId,
        tipo: solicitante.tipo || 'Material', // <-- Dinâmico! Entende qual tela enviou.
        nome_solicitante: solicitante.nome,
        wbs_origem: wbsOrigem,                // <-- Salva de onde o item está saindo
        wbs_destino: solicitante.wbs,         // <-- Salva para onde o item vai
        destino: solicitante.destino || null,
        data_necessidade: solicitante.dataNecessidade || null,
        observacoes: solicitante.observacoes,
        entrega_urgente: solicitante.entregaUrgente || false,
        status: 'Pendente'
      }]);

    if (erroPS) throw erroPS;

    // 3. Prepara os itens para inserir na tabela 'solicitacoes_itens'
    const itensParaInserir = itens.map(item => ({
      solicitacao_id: psId,
      desenho_sap_manual: item.desenhoSAP || null,
      part_number_manual: item.numPecaFabricante || null,
      descricao_manual: item.materialDescription || null,
      quantidade_solicitada: item.qtdSelecionada || item.qtd, 
      unidade_medida_manual: item.unidadeMedida || item.unid || 'Unid',
      valor_unitario_manual: item.poNetPrice ? parseFloat(String(item.poNetPrice).replace(/[^\d.,]/g, '').replace(',', '.')) : 0
    }));

    // 4. Salva todos os itens de uma vez só!
    const { error: erroItens } = await supabase
      .from('solicitacoes_itens')
      .insert(itensParaInserir);

    if (erroItens) throw erroItens;

    // Se deu tudo certo, responde com sucesso
    res.status(201).json({ 
      sucesso: true, 
      mensagem: 'Solicitação criada com sucesso!', 
      ps_id: psId 
    });

  } catch (error) {
    console.error('[Erro ao criar solicitação]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao salvar a solicitação no banco.' });
  }
});

module.exports = router;