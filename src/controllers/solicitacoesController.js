// src/controllers/solicitacoesController.js
const service = require('../services/solicitacoesService');

const listar = async (req, res) => {
  try {
    const dados = await service.listarSolicitacoes();
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

// Funções criadoras modulares (Tratam o Sucesso e o Erro HTTP automaticamente)
const criarResposta = (res, promessaID) => {
  promessaID.then(id => res.status(201).json({ sucesso: true, ps_id: id }))
            .catch(error => {
              console.error('[Erro na Operação]:', error);
              res.status(500).json({ sucesso: false, erro: 'Falha ao processar solicitação.' });
            });
};

// As nossas 7 rotas com suporte a anexos!
const criarMaterial = (req, res) => criarResposta(res, service.criarMaterial(req.body.solicitante, req.body.itens, req.body.anexos));
const criarTransferencia = (req, res) => criarResposta(res, service.criarTransferencia(req.body.solicitante, req.body.itens, req.body.anexos));
const criarEntrada = (req, res) => criarResposta(res, service.criarEntrada(req.body.solicitante, req.body.itens, req.body.anexos));
const criarCrossdocking = (req, res) => criarResposta(res, service.criarCrossdocking(req.body.solicitante, req.body.itens, req.body.anexos));
const criarNotaFiscal = (req, res) => criarResposta(res, service.criarNotaFiscal(req.body.solicitante, req.body.anexos));
const criarReintegracao = (req, res) => criarResposta(res, service.criarReintegracao(req.body.solicitante, req.body.anexos));
const cancelarBS = (req, res) => criarResposta(res, service.cancelarBS(req.body.solicitante, req.body.anexos));

module.exports = {
  listar,
  criarMaterial,
  criarTransferencia,
  criarEntrada,
  criarCrossdocking,
  criarNotaFiscal,
  criarReintegracao,
  cancelarBS
};