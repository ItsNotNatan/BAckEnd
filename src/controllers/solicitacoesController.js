// src/controllers/solicitacoesController.js
const solicitacoesService = require('../services/solicitacoesService');

const listar = async (req, res) => {
  try {
    // Chama o serviço que faz todo o trabalho duro
    const dados = await solicitacoesService.listarSolicitacoes();
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Controller - Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

const criar = async (req, res) => {
  const { solicitante, itens } = req.body;

  try {
    // Passa a bola para o serviço criar a solicitação
    const psId = await solicitacoesService.criarSolicitacao(solicitante, itens);

    res.status(201).json({ 
      sucesso: true, 
      mensagem: 'Solicitação processada e salva com sucesso!', 
      ps_id: psId 
    });
  } catch (error) {
    console.error('[Controller - Erro ao criar solicitação]:', error);
    res.status(500).json({ sucesso: false, erro: error.message || 'Falha ao salvar a solicitação no banco.' });
  }
};

module.exports = {
  listar,
  criar
};