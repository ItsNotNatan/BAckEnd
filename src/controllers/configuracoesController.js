const service = require('../services/configuracoesService');

const obter = async (req, res) => {
  try {
    const valor = await service.obterTarget();
    res.status(200).json({ sucesso: true, dados: valor });
  } catch (error) {
    console.error('[Erro ao buscar target]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar configurações.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { valor } = req.body;
    if (!valor) return res.status(400).json({ sucesso: false, erro: 'Valor inválido.' });

    await service.atualizarTarget(valor);
    res.status(200).json({ sucesso: true, mensagem: 'Target atualizado com sucesso!' });
  } catch (error) {
    console.error('[Erro ao atualizar target]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao gravar configuração.' });
  }
};

module.exports = { obter, atualizar };