// src/controllers/solicitacoesController.js
const service = require('../services/solicitacoesService');

// Lista todas as solicitações vindas do banco
// src/controllers/solicitacoesController.js

// Lista as solicitações vindas do banco de forma paginada e filtrada
const listar = async (req, res) => {
  try {
    // Captura os parâmetros da URL. Se não existirem, assume valores padrão (Página 1, Limite 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const busca = req.query.busca || '';
    const tipo = req.query.tipo || '';

    // Invoca o serviço repassando a paginação e os filtros textuais/categoria
    const { dados, total } = await service.listarSolicitacoes(page, limit, busca, tipo);
    
    // Retorna a estrutura exata esperada pelo componente React (sucesso, linhas da página e total absoluto)
    res.status(200).json({ sucesso: true, dados, total });
  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

// Função auxiliar para padronizar as respostas de criação
const criarResposta = (res, promessaID) => {
  promessaID
    .then(id => {
      console.log(`✅ [SUCESSO] Operação concluída no banco. ID gerado: ${id}\n`);
      res.status(201).json({ sucesso: true, ps_id: id });
    })
    .catch(error => {
      console.log("\n❌ [FALHA CRÍTICA] Erro no momento de salvar no banco:");
      console.error(error); // Imprime o erro real do Supabase no terminal
      res.status(500).json({ sucesso: false, erro: 'Falha ao processar solicitação.' });
    });
};

// Handlers para criação de cada tipo de solicitação
const criarMaterial = (req, res) => {
  console.log("\n==================================================");
  console.log("📡 [NODE.JS] CHEGOU UM PEDIDO DE MATERIAL!");
  console.log("👤 Solicitante:", req.body.solicitante.nome);
  console.log("📦 Total de itens recebidos:", req.body.itens.length);
  console.log("==================================================\n");

  criarResposta(res, service.criarMaterial(req.body.solicitante, req.body.itens, req.body.anexos));
};
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

// 👇 Adiciona antes do module.exports
const removerAnexo = async (req, res) => {
  const { anexoId } = req.params;
  try {
    await service.deletarAnexo(anexoId);
    res.status(200).json({ sucesso: true, mensagem: 'Anexo removido com sucesso.' });
  } catch (error) {
    console.error(`[Erro ao deletar anexo ${anexoId}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao remover o anexo.' });
  }
};

const reverterItem = async (req, res) => {
  // Pega o ID que o frontend enviou quando clicaste no botão
  const { id_item } = req.body;

  try {
    // Manda o serviço fazer a matemática
    await service.reverterItemParaEstoque(id_item);
    
    // Devolve sucesso para o frontend
    res.status(200).json({ sucesso: true, mensagem: 'Item revertido para o estoque com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao reverter item ${id_item}]:`, error.message);
    res.status(500).json({ sucesso: false, erro: error.message || 'Falha ao devolver o item ao estoque.' });
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
  removerAnexo,
  reverterItem,
  adicionarAnexosExtras
};