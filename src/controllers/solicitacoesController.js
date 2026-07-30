// src/controllers/solicitacoesController.js
const service = require('../services/solicitacoesService');

// Lista as solicitações vindas do banco de forma paginada e filtrada
const listar = async (req, res) => {
  try {
    // Captura os parâmetros da URL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const busca = req.query.busca || '';
    const tipo = req.query.tipo || '';
    
    // 👇 AQUI: Capturamos a filial que o Front-end está a enviar
    const filial = req.query.filial || '';

    // Invoca o serviço repassando a paginação, filtros e a filial
    const { dados, total } = await service.listarSolicitacoes(page, limit, busca, tipo, filial);
    
    // Retorna a estrutura exata esperada pelo componente React
    res.status(200).json({ sucesso: true, dados, total });
  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

// Função auxiliar para padronizar as respostas de criação
const criarResposta = (res, promessaID) => {
  promessaID
    .then(resultado => {
      console.log(`✅ [SUCESSO] Operação concluída. UUID: ${resultado.id} | PS: ${resultado.ps}\n`);
      res.status(201).json({ sucesso: true, id: resultado.id, ps: resultado.ps });
    })
    .catch(error => {
      console.log("\n❌ [FALHA CRÍTICA] Erro no momento de salvar no banco:");
      console.error(error); 
      res.status(500).json({ sucesso: false, erro: 'Falha ao processar solicitação.' });
    });
};

// Handlers para criação de cada tipo de solicitação
const criarMaterial = (req, res) => {
  console.log("\n==================================================");
  console.log("📡 [NODE.JS] CHEGOU UM PEDIDO DE MATERIAL!");
  console.log("👤 Solicitante:", req.body.solicitante.nome);
  console.log("📍 Filial:", req.body.solicitante.filial_origem || req.body.solicitante.filial_id);
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

const atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { status, motivo_recusa, bs } = req.body; 

  try {
    await service.atualizarStatus(id, status, motivo_recusa, bs); 
    res.status(200).json({ sucesso: true, mensagem: `Status updated para ${status}` });
  } catch (error) {
    console.error(`[Erro ao atualizar status da PS ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar o status na base de dados.' });
  }
};

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
  const { id_item } = req.body;

  try {
    await service.reverterItemParaEstoque(id_item);
    res.status(200).json({ sucesso: true, mensagem: 'Item revertido para o estoque com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao reverter item ${id_item}]:`, error.message);
    res.status(500).json({ sucesso: false, erro: error.message || 'Falha ao devolver o item ao estoque.' });
  }
};

const atualizarLocalizacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { filial, centro, deposito } = req.body;

    await service.atualizarLocalizacao(id, { filial, centro, deposito });
    res.json({ sucesso: true, mensagem: 'Localização atualizada com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar localização:", error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// Recebe a requisição de atualização dos itens (Edição Inline)
const atualizarItens = async (req, res) => {
  const { id } = req.params;
  const { itens } = req.body;

  try {
    // Validação: garante que o frontend enviou um Array (lista)
    if (!itens || !Array.isArray(itens)) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'O formato dos itens é inválido. Esperava-se uma lista de itens.' 
      });
    }

    // Chama o Service para fazer a magia no banco de dados
    await service.atualizarItensDaSolicitacao(id, itens);
    
    console.log(`✅ [SUCESSO] Itens da Solicitação ${id} atualizados com sucesso!`);
    res.status(200).json({ sucesso: true, mensagem: 'Itens atualizados com sucesso.' });
    
  } catch (error) {
    console.error(`[Erro ao atualizar itens da PS ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao gravar os itens na base de dados.' });
  }
};

const listarDemandasPorMaterial = async (req, res) => {
  const { partNumber } = req.params;

  try {
    const dados = await service.listarDemandasPorMaterial(partNumber);

    // Formatamos os dados exatamente como a tua <TabelaDemandas /> gosta!
    const dadosFormatados = dados.map(item => ({
      id: item.solicitacoes.ps,
      solicitante: item.solicitacoes.nome_solicitante,
      wbs: item.solicitacoes.wbs_destino || '-',
      status: item.solicitacoes.status,
      bs: item.solicitacoes.bs || '-',
      criacaoBs: new Date(item.solicitacoes.created_at).toLocaleDateString('pt-BR'),
      dataEntrega: item.solicitacoes.data_necessidade ? new Date(item.solicitacoes.data_necessidade).toLocaleDateString('pt-BR') : 'não definido',
      // Aproveitamos a coluna de contagem para mostrar quantas peças saíram!
      contagem: `${item.quantidade_solicitada} unid.` 
    }));

    res.status(200).json({ sucesso: true, dados: dadosFormatados });
  } catch (error) {
    console.error(`[Erro ao buscar demandas do PN ${partNumber}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar demandas.' });
  }
};

module.exports = {
  listar,
  criarMaterial,
  criarTransferencia,
  criarEntrada,
  atualizarLocalizacao,
  criarCrossdocking,
  criarNotaFiscal,
  criarReintegracao,
  cancelarBS,
  atualizarStatus,
  removerAnexo,
  reverterItem,
  adicionarAnexosExtras,
  atualizarItens,
  listarDemandasPorMaterial
};