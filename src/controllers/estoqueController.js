// src/controllers/estoqueController.js
const service = require('../services/estoqueService');

/**
 * Controla a resposta HTTP para a listagem de estoque
 */
const listar = async (req, res) => {
  try {
    // 👇 1. Lemos a filial que o Front-end enviou no URL (ex: "BR02" ou "TODOS")
    const filial = req.query.filial || '';

    // 👇 2. Passamos a filial para a função do serviço
    const dados = await service.listarEstoqueGeral(filial);
    
    // Retorna no mesmo padrão que usas nas solicitações
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar estoque]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar dados do estoque físico.' });
  }
};

module.exports = {
  listar
};