// src/controllers/solicitacoesController.js
const service = require('../services/solicitacoesService');

// Lista todas as solicitações vindas do banco
const listar = async (req, res) => {
  try {
    const dados = await service.listarSolicitacoes();
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

// Função auxiliar para padronizar as respostas de criação
const criarResposta = (res, promessaID) => {
  promessaID.then(id => res.status(201).json({ sucesso: true, ps_id: id }))
            .catch(error => {
              console.error('[Erro na Operação]:', error);
              res.status(500).json({ sucesso: false, erro: 'Falha ao processar solicitação.' });
            });
};

// Handlers para criação de cada tipo de solicitação
const criarMaterial = (req, res) => criarResposta(res, service.criarMaterial(req.body.solicitante, req.body.itens, req.body.anexos));
const criarTransferencia = (req, res) => criarResposta(res, service.criarTransferencia(req.body.solicitante, req.body.itens, req.body.anexos));
const criarEntrada = (req, res) => criarResposta(res, service.criarEntrada(req.body.solicitante, req.body.itens, req.body.anexos));
const criarCrossdocking = (req, res) => criarResposta(res, service.criarCrossdocking(req.body.solicitante, req.body.itens, req.body.anexos));
const criarNotaFiscal = (req, res) => criarResposta(res, service.criarNotaFiscal(req.body.solicitante, req.body.anexos));
const criarReintegracao = (req, res) => criarResposta(res, service.criarReintegracao(req.body.solicitante, req.body.anexos));
const cancelarBS = (req, res) => criarResposta(res, service.cancelarBS(req.body.solicitante, req.body.anexos));

// Atualiza o status da PS (Aprovar / Reprovar)
const atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { status, motivo_recusa } = req.body;

  try {
    await service.atualizarStatus(id, status, motivo_recusa);
    res.status(200).json({ sucesso: true, mensagem: `Status updated para ${status}` });
  } catch (error) {
    console.error(`[Erro ao atualizar status da PS ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar o status na base de dados.' });
  }
};

// PROCESSA OS NOVOS ANEXOS ENVIADOS PELA LOGÍSTICA
const adicionarAnexosExtras = async (req, res) => {
  const { id } = req.params;
  const { anexos } = req.body;

  try {
    await service.salvarAnexosExtras(id, anexos);
    res.status(200).json({ sucesso: true, mensagem: 'Novos anexos integrados com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao adicionar anexos na PS ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao salvar novos anexos na base de dados.' });
  }
};

module.exports = {
  listar,
  criarMaterial,
  criarTransferencia,
  criarEntrada,
  criarCrossdocking,
  criarNotaFiscal,
  criarReintegracao,
  cancelarBS,
  atualizarStatus,
  adicionarAnexosExtras
};