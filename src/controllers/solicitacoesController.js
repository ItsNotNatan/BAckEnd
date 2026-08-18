// =================================================================
// ARQUIVO: src/controllers/solicitacoesController.js
// DESCRIÇÃO: Controlador que processa os pedidos HTTP das solicitações
// =================================================================
const service = require('../services/solicitacoesService');

const listar = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const busca = req.query.busca || '';
    const tipo = req.query.tipo || '';
    const filial = req.query.filial || '';

    const { dados, total } = await service.listarSolicitacoes(page, limit, busca, tipo, filial);
    
    res.status(200).json({ sucesso: true, dados, total });
  } catch (error) {
    console.error('[Erro ao listar solicitações]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar solicitações no banco.' });
  }
};

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
const criarReintegracao = (req, res) => criarResposta(res, service.criarReintegracao(req.body.solicitante, req.body.itens, req.body.anexos));
const cancelarPL = (req, res) => criarResposta(res, service.cancelarPL(req.body.solicitante, req.body.anexos));

const atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { status, motivo_recusa, pl } = req.body; 

  try {
    await service.atualizarStatus(id, status, motivo_recusa, pl); 
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

// ✨ AGORA SIM! O controlador Express correto recebendo (req, res) e extraindo a data_entrega
const atualizarLocalizacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { filial, centro, deposito, data_entrega } = req.body;

    await service.atualizarLocalizacao(id, { filial, centro, deposito, data_entrega });
    res.json({ sucesso: true, mensagem: 'Dados atualizados com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

const atualizarItens = async (req, res) => {
  const { id } = req.params;
  const { itens } = req.body;

  try {
    if (!itens || !Array.isArray(itens)) {
      return res.status(400).json({ sucesso: false, erro: 'Formato inválido.' });
    }

    await service.atualizarItensDaSolicitacao(id, itens);
    res.status(200).json({ sucesso: true, mensagem: 'Itens atualizados com sucesso.' });
  } catch (error) {
    console.error(`[Erro ao atualizar itens da PS ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao gravar os itens na base de dados.' });
  }
};

const listarDemandasPorEstoque = async (req, res) => {
  const { estoqueId } = req.params;

  try {
    const { demandas, edicoes } = await service.listarDemandasPorEstoque(estoqueId);

    // Formata os Fluxos Normais
    const dadosFormatados = demandas.map(item => ({
      idOriginal: item.solicitacoes.id,
      id: item.solicitacoes.ps,
      solicitante: item.solicitacoes.nome_solicitante,
      wbs: item.solicitacoes.wbs_destino || '-',
      status: item.solicitacoes.status,
      pl: item.solicitacoes.pl || '-',
      criacaoPl: new Date(item.solicitacoes.created_at).toLocaleDateString('pt-BR'),
      dataEntrega: item.solicitacoes.data_entrega ? new Date(item.solicitacoes.data_entrega).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'não definido',
      tipo: item.solicitacoes.tipo,
      qtdMovimentada: item.quantidade_solicitada || 0,
      unidadeMedida: item.unidade_medida_manual || 'Un',
      contagem: `${item.quantidade_solicitada} unid.`,
      contagemStatus: item.solicitacoes.status === 'Concluído' ? 'verde' : (item.solicitacoes.status === 'Cancelado' || item.solicitacoes.status === 'Recusado' ? 'vermelho' : 'amarelo'),
      timestamp: new Date(item.solicitacoes.created_at).getTime()
    }));

    const formataValor = (val) => (!val || val === 'null') ? '(Vazio)' : val;

    const dicionarioCampos = {
      quantidade_disponivel: 'SALDO', alocacao: 'ALOCAÇÃO', desenho_sap: 'SAP', part_number: 'PN',
      descricao: 'DESCRIÇÃO', fornecedor: 'FORNECEDOR', referencia: 'REFERÊNCIA', nf_entrada: 'NF',
      unidade_medida: 'UN.', valor_unitario: 'VALOR', wbs: 'WBS', centro: 'CENTRO', deposito: 'DEPÓSITO'
    };

    // Formata as Edições Manuais
    edicoes.forEach(ed => {
      const nomeCampo = dicionarioCampos[ed.campo_alterado] || ed.campo_alterado.toUpperCase();
      dadosFormatados.push({
        idOriginal: ed.id,
        id: `ED-${ed.id.substring(0,5).toUpperCase()}`,
        solicitante: ed.usuario,
        wbs: '-',
        status: 'Concluído',
        pl: '-',
        criacaoPl: new Date(ed.created_at).toLocaleDateString('pt-BR'),
        dataEntrega: '-',
        tipo: 'Edição Manual',
        qtdMovimentada: 0,
        unidadeMedida: '-',
        contagem: `[${nomeCampo}] De: ${formataValor(ed.valor_antigo)} ➔ Para: ${formataValor(ed.valor_novo)}`,
        contagemStatus: 'amarelo',
        timestamp: new Date(ed.created_at).getTime()
      });
    });

    // Ordena tudo cronologicamente (do mais recente para o mais antigo)
    dadosFormatados.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({ sucesso: true, dados: dadosFormatados });
  } catch (error) {
    console.error(`[Erro ao buscar demandas do estoque ${estoqueId}]:`, error);
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
  cancelarPL,
  atualizarStatus,
  removerAnexo,
  reverterItem,
  adicionarAnexosExtras,
  atualizarItens,
  listarDemandasPorEstoque
};