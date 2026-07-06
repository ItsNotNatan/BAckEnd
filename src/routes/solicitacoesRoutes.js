// routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Importa a conexão com o banco

// Rota POST: Criar uma nova Solicitação (PS) e seus itens
router.post('/nova', async (req, res) => {
  const { solicitante, itens } = req.body;

  try {
    // 1. Gera um ID para a PS (ex: PS-20260706-1234)
    const psId = `PS-${Date.now()}`;

    // 2. Insere a solicitação principal na tabela 'solicitacoes'
    const { error: erroPS } = await supabase
      .from('solicitacoes')
      .insert([{
        id: psId,
        tipo: 'Material', // Podemos tornar dinâmico depois
        wbs_destino: solicitante.wbs,
        observacoes: solicitante.observacoes,
        status: 'Pendente'
      }]);

    if (erroPS) throw erroPS;

    // 3. Prepara os itens para inserir na tabela 'solicitacoes_itens'
    const itensParaInserir = itens.map(item => ({
      solicitacao_id: psId,
      desenho_sap_manual: item.desenhoSAP,
      part_number_manual: item.numPecaFabricante,
      descricao_manual: item.materialDescription,
      quantidade_solicitada: item.qtdSelecionada || item.qtd,
      unidade_medida_manual: item.unidadeMedida || item.unid,
      valor_unitario_manual: parseFloat(String(item.poNetPrice || item.valorUnit).replace(/[^\d.,]/g, '').replace(',', '.')) || 0
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