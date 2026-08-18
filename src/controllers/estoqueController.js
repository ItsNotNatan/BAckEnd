// src/controllers/estoqueController.js
const service = require('../services/estoqueService');

const listar = async (req, res) => {
  try {
    const filial = req.query.filial || '';
    const incluirZerados = req.query.rastreabilidade === 'true';
    const dados = await service.listarEstoqueGeral(filial, incluirZerados);
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar estoque]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar dados do estoque físico.' });
  }
};

// ✨ NOVO CONTROLADOR: Lida com a edição inline
const atualizar = async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  try {
    // Basicamente, pegamos no ID da URL e nos dados do corpo (alocacao, quantidade, etc.) e mandamos para o serviço
    await service.atualizarItemEstoque(id, dados);
    res.status(200).json({ sucesso: true, mensagem: 'Item atualizado com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao atualizar item do estoque ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao gravar a alteração na base de dados.' });
  }
};

module.exports = {
  listar,
  atualizar // ✨ Exportar o novo controlador
};