const service = require('../services/filiaisService');

const listar = async (req, res) => {
  try {
    const dados = await service.listarFiliais();
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar filiais]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar filiais.' });
  }
};

const criar = async (req, res) => {
  try {
    await service.criarFilial(req.body);
    res.status(201).json({ sucesso: true, mensagem: 'Filial cadastrada com sucesso!' });
  } catch (error) {
    console.error('[Erro ao criar filial]:', error);
    if (error.code === '23505') {
      return res.status(400).json({ sucesso: false, erro: 'Já existe uma filial com este Código.' });
    }
    res.status(500).json({ sucesso: false, erro: 'Falha ao criar filial.' });
  }
};

const deletar = async (req, res) => {
  try {
    await service.deletarFilial(req.params.id);
    res.status(200).json({ sucesso: true, mensagem: 'Filial apagada com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao deletar filial ${req.params.id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao apagar filial.' });
  }
};

const atualizar = async (req, res) => {
  try {
    await service.atualizarFilial(req.params.id, req.body);
    res.status(200).json({ sucesso: true, mensagem: 'Filial atualizada com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao atualizar filial ${req.params.id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar filial.' });
  }
};

module.exports = { listar, criar, deletar, atualizar };