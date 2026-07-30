// src/services/solicitacoesService.js
const supabase = require('../config/supabase');

// --- 🛠️ FUNÇÃO AUXILIAR: Validador de ID ---
const limparIdEstoque = (id) => {
  if (!id) return null;
  const idString = String(id);
  if (idString.startsWith('manual-')) return null;
  return idString;
};

// --- 🛠️ FUNÇÃO AUXILIAR: Salva no Banco ---
// --- 🛠️ FUNÇÃO AUXILIAR: Salva no Banco ---
const salvarNoBanco = async (dadosPrincipais, itensArray, anexosArray = [], numeroDaNota = null) => {
  
  // 🛡️ NOVA TRAVA DE SEGURANÇA PARA A FILIAL "TODOS"
  // Verifica se a filial está vazia ou se é "TODOS". Se for, bloqueia e devolve um erro claro.
  if (!dadosPrincipais.filial_origem_id || dadosPrincipais.filial_origem_id === 'TODOS') {
    throw new Error("Ação bloqueada: Por favor, selecione uma filial física (BR02, BR04, BR06) no topo da página antes de enviar a solicitação.");
  }

  const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
  const psGerado = `PS-${dataAtual}-${numeroAleatorio}`;
  
  console.log(`💾 Iniciando gravação da solicitação: ${psGerado}`);

  console.log("-> 1/4: Tentando gravar na tabela 'solicitacoes'...");
  const { data: psData, error: erroPS } = await supabase.from('solicitacoes').insert([{
    ps: psGerado, 
    ...dadosPrincipais
  }]).select('id, ps').single(); 

  if (erroPS) throw erroPS;

  const uuidGerado = psData.id; 

  if (itensArray && itensArray.length > 0) {
    const itensParaInserir = itensArray.map(item => ({
      solicitacao_id: uuidGerado, 
      ...item
    }));
    const { error: erroItens } = await supabase.from('solicitacoes_itens').insert(itensParaInserir);
    if (erroItens) throw erroItens;
  }

  if (anexosArray && anexosArray.length > 0) {
    const anexosParaInserir = anexosArray.map(anexo => ({
      solicitacao_id: uuidGerado,
      nome_arquivo: anexo.nome_arquivo,
      url_arquivo: anexo.url_arquivo
    }));
    const { error: erroAnexos } = await supabase.from('anexos').insert(anexosParaInserir);
    if (erroAnexos) throw erroAnexos;
  }

  if (numeroDaNota) {
    const { error: erroNF } = await supabase.from('notas_fiscais').insert([{
      solicitacao_id: uuidGerado,
      numero_nf: numeroDaNota
    }]);
    if (erroNF) throw erroNF;
  }

  return { id: uuidGerado, ps: psGerado }; 
};

// =========================================================
// 🚀 SERVIÇOS ESPECÍFICOS POR TIPO DE SOLICITAÇÃO
// =========================================================

const listarSolicitacoes = async (page = 1, limit = 10, busca = '', tipo = '', filial = '') => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('solicitacoes')
    .select(`
      id, ps, bs, tipo, nome_solicitante, wbs_destino, wbs_origem, filial_origem_id, observacoes, 
      data_necessidade, entrega_urgente, status, created_at, updated_at, 
      boletins_saida (numero_bs), notas_fiscais (numero_nf), 
      anexos (id, nome_arquivo, url_arquivo, origem), solicitacoes_itens (*)
    `, { count: 'exact' });

  if (tipo && tipo !== 'Todos') {
    query = query.eq('tipo', tipo);
  }

  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_origem_id', filial);
  }

  if (busca) {
    query = query.or(`id.ilike.%${busca}%,nome_solicitante.ilike.%${busca}%,wbs_destino.ilike.%${busca}%,wbs_origem.ilike.%${busca}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const dadosFormatados = data.map(sol => {
    let numeroBS = null;
    if (sol.boletins_saida) {
      if (Array.isArray(sol.boletins_saida) && sol.boletins_saida.length > 0) {
        numeroBS = sol.boletins_saida[0].numero_bs;
      } else if (!Array.isArray(sol.boletins_saida) && sol.boletins_saida.numero_bs) {
        numeroBS = sol.boletins_saida.numero_bs;
      }
    }

    return {
      id: sol.id,
      tipo: sol.tipo,
      nfCrossdocking: sol.notas_fiscais && sol.notas_fiscais.length > 0 ? sol.notas_fiscais[0].numero_nf : (sol.notas_fiscais?.numero_nf || null),
      solicitante: sol.nome_solicitante || 'Não informado',
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      bs: numeroBS ? `BS #${numeroBS}` : null,
      filial: sol.filial_origem_id || '-',
      dataSolicitacao: new Date(sol.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(sol.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataCriacaoISO: sol.created_at,
      dataFinalizacaoISO: (sol.status === 'Concluído' && sol.updated_at) ? sol.updated_at : null,
      dataEntrega: sol.status === 'Concluído' ? 'Disponível' : null,
      status: sol.status,
      observacoes: sol.observacoes,
      entregaUrgente: sol.entrega_urgente,
      anexos: sol.anexos || [],
      itens: sol.solicitacoes_itens || []
    };
  });

  return { 
    dados: dadosFormatados, 
    total: count || 0 
  };
};

const criarMaterial = async (solicitante, itens, anexos) => {
  const dados = {
    tipo: 'Material',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    destino: solicitante.destino,
    data_necessidade: solicitante.dataNecessidade || null,
    observacoes: solicitante.observacoes,
    entrega_urgente: solicitante.entregaUrgente || false,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = itens.map(i => ({
    estoque_id: limparIdEstoque(i.estoque_id || i.id),
    desenho_sap_manual: i.desenhoSAP,
    part_number_manual: i.numPecaFabricante,
    descricao_manual: i.materialDescription || 'Sem descrição',
    quantidade_solicitada: Math.max(1, i.qtdSelecionada || 1),
    unidade_medida_manual: i.unidadeMedida || 'Unid'
  }));

  return await salvarNoBanco(dados, itensDB, anexos);
};

const criarTransferencia = async (solicitante, itens, anexos) => {
  const wbsOrig = itens && itens.length > 0 ? itens[0].wbsOrigem : null;
  const dados = {
    tipo: 'Transferencia WBS',
    nome_solicitante: solicitante.nome,
    wbs_origem: wbsOrig,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    entrega_urgente: solicitante.entregaUrgente || false,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = itens.map(i => ({
    estoque_id: limparIdEstoque(i.estoque_id || i.id),
    part_number_manual: i.numPecaFabricante || i.pn,
    descricao_manual: i.materialDescription || i.desc,
    quantidade_solicitada: Math.max(1, i.qtd || 1)
  }));

  return await salvarNoBanco(dados, itensDB, anexos);
};

const criarEntrada = async (solicitante, itens, anexos) => {
  const dados = {
    tipo: 'Entrada',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = itens.map(i => {
    let precoLimpo = 0;
    if (i.poNetPrice) {
      let v = String(i.poNetPrice).replace(/[^\d.,-]/g, '');
      if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
      else if (v.includes(',')) v = v.replace(',', '.');
      precoLimpo = parseFloat(v) || 0;
    }

    return {
      desenho_sap_manual: i.desenhoSAP || '-',
      part_number_manual: i.numPecaFabricante,
      descricao_manual: i.materialDescription || i.vendorDescription || 'Sem descrição',
      quantidade_solicitada: Math.max(1, i.qtd || i.qtdFornecida || 1),
      unidade_medida_manual: i.unidadeMedida || 'Unid',
      valor_unitario_manual: precoLimpo,
      fornecedor: i.fornecedor || null,
      nf_entrada: i.nfEntrada || null,
      wbs_element: i.wbsElement || null,
      emissao_nf: i.emissaoNF || null,
      receb_nf: i.recebNF || null,
      documento_compras: i.docCompras || null,
      centro: i.centro || null,
      deposito: i.deposito || null,
      alocacao: i.alocacao || null
    };
  });

  return await salvarNoBanco(dados, itensDB, anexos);
};

const criarCrossdocking = async (solicitante, itens, anexos) => {
  const dados = {
    tipo: 'Crossdocking',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = (itens || []).map(i => ({
    desenho_sap_manual: i.desenho_sap_manual,
    quantidade_solicitada: Math.max(1, i.quantidade_solicitada || 1),
    unidade_medida_manual: i.unidade_medida_manual
  }));

  return await salvarNoBanco(dados, itensDB, anexos, solicitante.nf);
};

const criarNotaFiscal = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Nota Fiscal',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  let valorStr = String(solicitante.valorEstimado || '0');
  if (valorStr.includes('.') && valorStr.includes(',')) {
    valorStr = valorStr.replace(/\./g, '').replace(',', '.');
  } else if (valorStr.includes(',')) {
    valorStr = valorStr.replace(',', '.');
  } else {
    valorStr = valorStr.replace(/[^\d.-]/g, '');
  }

  const itensDB = [{
    descricao_manual: solicitante.descricao,
    quantidade_solicitada: 1,
    valor_unitario_manual: parseFloat(valorStr) || 0
  }];

  return await salvarNoBanco(dados, itensDB, anexos);
};

const criarReintegracao = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Reintegracao',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: `[Reintegração] Originado do BS #${solicitante.bs_origem}`,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };
  return await salvarNoBanco(dados, [], anexos);
};

const cancelarBS = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Crossdocking',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Cancelado',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };
  return await salvarNoBanco(dados, [], anexos);
};

// =========================================================
// 🔄 ATUALIZAÇÃO DE STATUS E MATEMÁTICA DE ESTOQUE
// =========================================================
const atualizarStatus = async (id, statusRecebido, motivoRecusa, numeroBS) => {
  const { data: solicitacao, error: erroBusca } = await supabase
    .from('solicitacoes')
    .select('tipo, filial_origem_id, observacoes')
    .eq('id', id)
    .single();

  if (erroBusca || !solicitacao) throw new Error('Solicitação não encontrada.');

  let statusFinal = statusRecebido;

  if (solicitacao.tipo === 'Entrada' && (statusRecebido === 'Em Separação' || statusRecebido === 'Aprovado' || statusRecebido === 'Concluído')) {
    statusFinal = 'Concluído';
  }
  else if (solicitacao.tipo === 'Transferencia WBS' && (statusRecebido === 'Em Separação' || statusRecebido === 'Aprovado')) {
    statusFinal = 'Concluído';
  }

  let atualizacaoPS = { status: statusFinal, updated_at: new Date() };

  if (numeroBS) {
    atualizacaoPS.bs = numeroBS;
  }

  if (motivoRecusa) {
    const obsAntiga = solicitacao.observacoes || '';
    atualizacaoPS.observacoes = `${obsAntiga}\n[RECUSADO]: ${motivoRecusa}`.trim();
  }

  const { error: erroPS } = await supabase
    .from('solicitacoes')
    .update(atualizacaoPS)
    .eq('id', id);

  if (erroPS) throw erroPS;

  const foiAprovado = (statusFinal === 'Em Separação' || statusFinal === 'Concluído');
  
  // ✨ NOVO: Preparar variável para receber o BS
  let numeroBSGerado = null; 

  if (foiAprovado) {

    if (solicitacao.tipo !== 'Entrada') {
      // ✨ NOVO: Adicionado .select('numero_bs') para capturar o número imediatamente
      const { data: dadosBS, error: erroBS } = await supabase
        .from('boletins_saida')
        .insert([{
          solicitacao_id: id,
          status: statusFinal === 'Concluído' ? 'Concluído' : 'Em Separação'
        }])
        .select('numero_bs')
        .single();

      if (erroBS && erroBS.code !== '23505') throw erroBS;
      
      // ✨ NOVO: Guardamos o número retornado pelo banco
      if (dadosBS) {
        numeroBSGerado = dadosBS.numero_bs;
      }
    }

    const tiposDeSaida = ['Material', 'Transferencia WBS', 'Crossdocking'];

    if (tiposDeSaida.includes(solicitacao.tipo)) {
      const { data: itensPedidos } = await supabase
        .from('solicitacoes_itens')
        .select('estoque_id, quantidade_solicitada')
        .eq('solicitacao_id', id);

      if (itensPedidos && itensPedidos.length > 0) {
        for (const item of itensPedidos) {
          if (item.estoque_id) {
            
            const { data: estoqueAtual } = await supabase
              .from('estoque')
              .select('*')
              .eq('id', item.estoque_id)
              .single();

            if (estoqueAtual) {
              const saldoAtual = Number(estoqueAtual.quantidade_disponivel || 0);
              const quantidadeRetirada = Number(item.quantidade_solicitada || 0);

              const novoSaldo = saldoAtual - quantidadeRetirada;
              const saldoFinalSeguro = novoSaldo < 0 ? 0 : novoSaldo;
              const novoStatusEstoque = saldoFinalSeguro <= 0 ? 'Zerado' : 'Disponível';

              await supabase
                .from('estoque')
                .update({
                  quantidade_disponivel: saldoFinalSeguro,
                  status: novoStatusEstoque,
                  updated_at: new Date()
                })
                .eq('id', item.estoque_id);

              if (solicitacao.tipo === 'Transferencia WBS') {
                console.log(`🔄 [TRANSFERÊNCIA] Criando nova entrada para o WBS: ${solicitacao.wbs_destino}`);
                
                const itemParaNovoWBS = {
                  material_id: estoqueAtual.material_id,
                  filial_id: estoqueAtual.filial_id,
                  desenho_sap: estoqueAtual.desenho_sap, 
                  part_number: estoqueAtual.part_number,
                  descricao: estoqueAtual.descricao,
                  nf_entrada: estoqueAtual.nf_entrada,
                  documento_compras: estoqueAtual.documento_compras,
                  quantidade_disponivel: quantidadeRetirada,
                  status: 'Disponível',
                  wbs: solicitacao.wbs_destino, 
                  is_transferencia: true,
                  alocacao: `Origem: ${solicitacao.wbs_origem || estoqueAtual.wbs || 'Desconhecida'}`
                };

                const { error: erroTransf } = await supabase
                  .from('estoque')
                  .insert([itemParaNovoWBS]);
                  
                if (erroTransf) {
                  console.error("❌ Erro ao criar item transferido no estoque:", erroTransf);
                } else {
                  console.log("✅ [TRANSFERÊNCIA] Material alocado no novo projeto com sucesso!");
                }
              }
            }
          }
        }
      }
    }

    else if (solicitacao.tipo === 'Entrada') {
      console.log("🛠️ [BACKEND - ETAPA 1] Solicitação é do tipo Entrada. A procurar itens da solicitação...");

      const { data: itensEntrada, error: erroBuscaItens } = await supabase
        .from('solicitacoes_itens')
        .select('*')
        .eq('solicitacao_id', id);

      if (erroBuscaItens) {
        console.error("❌ [BACKEND - ERRO] Falha ao procurar itens da solicitação:", erroBuscaItens);
      }

      if (itensEntrada && itensEntrada.length > 0) {
        const novoEstoqueLotes = itensEntrada.map(item => ({
          material_id: item.material_id || null,
          part_number: item.part_number_manual || 'SEM-PN',
          descricao: item.descricao_manual || 'Sem descrição',
          filial_id: solicitacao.filial_origem_id || 'BR06',
          nf_entrada: item.nf_entrada || 'SEM-NF',
          documento_compras: item.documento_compras || '-',
          wbs: item.wbs_element || '-',
          alocacao: item.alocacao || 'Pendente',
          quantidade_disponivel: item.quantidade_solicitada,
          status: 'Disponível'
        }));

        const { error: erroEstoque } = await supabase
          .from('estoque')
          .insert(novoEstoqueLotes);

        if (erroEstoque) {
          console.error("❌ [BACKEND - ERRO FATAL] Erro ao gravar dados na tabela 'estoque':", erroEstoque);
        } else {
          console.log("✅ [BACKEND - SUCESSO] Material inserido no Estoque Físico com sucesso!");
        }
      } else {
        console.log("⚠️ [BACKEND - AVISO] A solicitação não tinha nenhum item atrelado a ela.");
      }
    }
  }

  // ✨ NOVO: Retorna o BS para o Controller usar!
  return { sucesso: true, numeroBS: numeroBSGerado };
};

const salvarAnexosExtras = async (solicitacaoId, anexosArray) => {
  if (!anexosArray || anexosArray.length === 0) return false;

  const anexosParaInserir = anexosArray.map(anexo => ({
    solicitacao_id: solicitacaoId,
    nome_arquivo: anexo.nome_arquivo,
    url_arquivo: anexo.url_arquivo,
    origem: 'logistica'
  }));

  const { error } = await supabase.from('anexos').insert(anexosParaInserir);
  if (error) throw error;

  return true;
};

const deletarAnexo = async (anexoId) => {
  const { data: anexo } = await supabase.from('anexos').select('*').eq('id', anexoId).single();

  if (anexo && anexo.url_arquivo) {
    const urlParts = anexo.url_arquivo.split('/documentos/');
    if (urlParts.length > 1) {
      await supabase.storage.from('documentos').remove([urlParts[1]]);
    }
  }

  const { error } = await supabase.from('anexos').delete().eq('id', anexoId);
  if (error) throw error;

  return true;
};

const reverterItemParaEstoque = async (idItem) => {
  const { data: itemPedido, error: erroBusca } = await supabase
    .from('solicitacoes_itens')
    .select('quantidade_solicitada, estoque_id')
    .eq('id', idItem)
    .single();

  if (erroBusca || !itemPedido) throw new Error('Item não encontrado na solicitação.');

  if (!itemPedido.estoque_id) throw new Error('Este item não possui vínculo direto com uma prateleira de estoque para devolução.');

  const { data: itemEstoque, error: erroEstoque } = await supabase
    .from('estoque')
    .select('id, quantidade_disponivel')
    .eq('id', itemPedido.estoque_id)
    .single();

  if (erroEstoque || !itemEstoque) throw new Error('Material não encontrado no estoque para devolução.');

  const novaQuantidade = itemEstoque.quantidade_disponivel + itemPedido.quantidade_solicitada;

  const { error: erroUpdate } = await supabase
    .from('estoque')
    .update({
      quantidade_disponivel: novaQuantidade,
      status: 'Disponível'
    })
    .eq('id', itemEstoque.id);

  if (erroUpdate) throw erroUpdate;

  const { error: erroDelete } = await supabase
    .from('solicitacoes_itens')
    .delete()
    .eq('id', idItem);

  if (erroDelete) throw erroDelete;

  return true;
};

const buscarHistoricoItem = async (estoqueId) => {
  const { data, error } = await supabase
    .from('solicitacoes_itens')
    .select(`
      quantidade_solicitada,
      created_at,
      solicitacoes (
        id,
        nome_solicitante,
        status,
        wbs_destino
      )
    `)
    .eq('estoque_id', estoqueId);

  if (error) throw error;

  return data.map(item => ({
    quantidade: item.quantidade_solicitada,
    dataSaida: new Date(item.created_at).toLocaleDateString('pt-BR'),
    solicitacao: item.solicitacoes?.id,
    solicitante: item.solicitacoes?.nome_solicitante,
    status: item.solicitacoes?.status,
    wbs: item.solicitacoes?.wbs_destino
  }));
};

const atualizarLocalizacao = async (id, dadosLocal) => {
  if (dadosLocal.filial) {
    const { error: erroSol } = await supabase
      .from('solicitacoes')
      .update({ filial_origem_id: dadosLocal.filial })
      .eq('id', id);
      
    if (erroSol) throw erroSol;
  }

  if (dadosLocal.centro || dadosLocal.deposito) {
    const atualizacaoItens = {};
    if (dadosLocal.centro) atualizacaoItens.centro = dadosLocal.centro;
    if (dadosLocal.deposito) atualizacaoItens.deposito = dadosLocal.deposito;

    const { error: erroItens } = await supabase
      .from('solicitacoes_itens')
      .update(atualizacaoItens)
      .eq('solicitacao_id', id);
      
    if (erroItens) throw erroItens;
  }

  return true;
};

// =========================================================
// ✏️ ATUALIZAÇÃO DE ITENS (EDIÇÃO INLINE)
// =========================================================
// =========================================================
// ✏️ ATUALIZAÇÃO DE ITENS (EDIÇÃO INLINE)
// =========================================================
const atualizarItensDaSolicitacao = async (solicitacaoId, itens) => {
  // 1. Apagamos os itens antigos vinculados a esta solicitação.
  const { error: erroDelete } = await supabase
    .from('solicitacoes_itens')
    .delete()
    .eq('solicitacao_id', solicitacaoId);

  if (erroDelete) throw erroDelete;

  // 2. Se a lista ficou vazia, terminamos a função aqui com sucesso.
  if (!itens || itens.length === 0) return true;

  // 3. Mapeamos os campos recebidos do Frontend para as colunas exatas do teu banco
  const itensDB = itens.map(i => {
    // Tratamento seguro para transformar valores em dinheiro em números decimais
    let precoLimpo = 0;
    if (i.poNetPrice) {
      let v = String(i.poNetPrice).replace(/[^\d.,-]/g, '');
      if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
      else if (v.includes(',')) v = v.replace(',', '.');
      precoLimpo = parseFloat(v) || 0;
    }

    return {
      solicitacao_id: solicitacaoId,
      part_number_manual: i.numPecaFabricante || i.part_number || null,
      fornecedor: i.fornecedor || null,
      quantidade_solicitada: Math.max(1, Number(i.qtdFornecida || i.quantidade_solicitada || i.quantidade || i.qtd || 1)),
      nf_entrada: i.nfEntrada || null,
      unidade_medida_manual: i.unidadeMedida || 'Unid',
      descricao_manual: i.vendorDescription || i.materialDescription || i.descricao || 'Sem descrição',
      wbs_element: i.wbsElement || null,
      
      // ❌ REMOVIDO: data_necessidade (pertence à tabela 'solicitacoes' e não aos itens)
      
      emissao_nf: i.emissaoNF ? i.emissaoNF : null,
      receb_nf: i.recebNF ? i.recebNF : null,
      documento_compras: i.docCompras || null,
      valor_unitario_manual: precoLimpo,
      centro: i.centro || null,
      deposito: i.deposito || null,
      alocacao: i.alocacao || null
    };
  });

  // 4. Inserimos a nova lista na base de dados
  const { error: erroInsert } = await supabase
    .from('solicitacoes_itens')
    .insert(itensDB);

  if (erroInsert) throw erroInsert;

  return true;
};

module.exports = {
  listarSolicitacoes,
  criarMaterial,
  criarTransferencia,
  criarEntrada,
  criarCrossdocking,
  criarNotaFiscal,
  criarReintegracao,
  cancelarBS,
  atualizarStatus,
  deletarAnexo,
  reverterItemParaEstoque,
  buscarHistoricoItem,
  atualizarLocalizacao,
  salvarAnexosExtras,
  atualizarItensDaSolicitacao
};