// =================================================================
// ARQUIVO: src/services/solicitacoesService.js
// DESCRIÇÃO: Lógica de negócio e comunicação com o Supabase
// =================================================================
const supabase = require('../config/supabase');

const limparIdEstoque = (id) => {
  if (!id) return null;
  const idString = String(id);
  if (idString.startsWith('manual-')) return null;
  return idString;
};

const salvarNoBanco = async (dadosPrincipais, itensArray, anexosArray = [], numeroDaNota = null) => {
  if (!dadosPrincipais.filial_origem_id || dadosPrincipais.filial_origem_id === 'TODOS') {
    throw new Error("Ação bloqueada: Por favor, selecione uma filial física no topo da página.");
  }

  const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
  const psGerado = `PS-${dataAtual}-${numeroAleatorio}`;

  console.log(`💾 Iniciando gravação da solicitação: ${psGerado}`);

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

const listarSolicitacoes = async (page = 1, limit = 10, busca = '', tipo = '', filial = '') => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('solicitacoes')
    .select(`
      id, ps, pl, tipo, nome_solicitante, wbs_destino, wbs_origem, filial_origem_id, observacoes, 
      data_necessidade, data_entrega, entrega_urgente, status, created_at, updated_at, data_aprovacao_pl, prazo_finalizacao_pl,
      packing_lists (numero_pl), notas_fiscais (numero_nf), 
      anexos (id, nome_arquivo, url_arquivo, origem), solicitacoes_itens (*)
    `, { count: 'exact' });

  if (tipo && tipo !== 'Todos') {
    query = query.eq('tipo', tipo);
  }

  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_origem_id', filial);
  }

  if (busca) {
    query = query.or(`ps.ilike.%${busca}%,nome_solicitante.ilike.%${busca}%,wbs_destino.ilike.%${busca}%,wbs_origem.ilike.%${busca}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const dadosFormatados = data.map(sol => {
    let numeroPL = null;
    if (sol.packing_lists) {
      if (Array.isArray(sol.packing_lists) && sol.packing_lists.length > 0) {
        numeroPL = sol.packing_lists[0].numero_pl;
      } else if (!Array.isArray(sol.packing_lists) && sol.packing_lists.numero_pl) {
        numeroPL = sol.packing_lists.numero_pl;
      }
    }

    const plFinal = sol.pl || (numeroPL ? `PL #${numeroPL}` : null);
    const dataAprovacaoValida = sol.data_aprovacao_pl || (sol.status !== 'Pendente' ? sol.updated_at : null);

    return {
      id: sol.id,
      ps: sol.ps,
      tipo: sol.tipo,
      nfCrossdocking: sol.notas_fiscais && sol.notas_fiscais.length > 0 ? sol.notas_fiscais[0].numero_nf : (sol.notas_fiscais?.numero_nf || null),
      solicitante: sol.nome_solicitante || 'Não informado',
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      pl: plFinal,
      filial: sol.filial_origem_id || '-',
      dataSolicitacao: new Date(sol.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(sol.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataCriacaoISO: sol.created_at,
      dataAprovacaoPL: dataAprovacaoValida,
      prazoFinalizacao: sol.prazo_finalizacao_pl,
      criacaoPl: dataAprovacaoValida
        ? new Date(dataAprovacaoValida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(dataAprovacaoValida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : null,
      dataFinalizacaoISO: (sol.status === 'Concluído' && sol.updated_at) ? sol.updated_at : null,

      dataEntrega: sol.data_entrega
        ? new Date(sol.data_entrega).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' às')
        : (sol.status === 'Concluído' ? 'Disponível' : null),

      status: sol.status,
      observacoes: sol.observacoes,
      entregaUrgente: sol.entrega_urgente,
      anexos: sol.anexos || [],
      itens: sol.solicitacoes_itens || []
    };
  });

  return { dados: dadosFormatados, total: count || 0 };
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
    desenho_sap_manual: i.desenhoSAP || null,
    part_number_manual: i.numPecaFabricante || null,
    descricao_manual: i.materialDescription || 'Sem descrição',
    quantidade_solicitada: Math.max(1, i.qtdSelecionada || 1),
    unidade_medida_manual: i.unidadeMedida || 'Unid',
    fornecedor: i.fornecedor || null,
    referencia: i.referencia || null,
    wbs_element: i.wbs || null,
    alocacao: i.alocacao || null
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
    const valorFront = i.valor_unitario || i.poNetPrice;
    if (valorFront) {
      let v = String(valorFront).replace(/[^\d.,-]/g, '');
      if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
      else if (v.includes(',')) v = v.replace(',', '.');
      precoLimpo = parseFloat(v) || 0;
    }

    return {
      desenho_sap_manual: i.desenho_sap || i.desenhoSAP || '-',
      part_number_manual: i.part_number || i.numPecaFabricante || 'SEM-PN',
      descricao_manual: i.descricao || i.materialDescription || i.vendorDescription || 'Sem descrição',
      quantidade_solicitada: Math.max(1, i.qtd || i.qtdFornecida || 1),
      unidade_medida_manual: i.unidade_medida || i.unidadeMedida || 'Unid',
      valor_unitario_manual: precoLimpo,
      fornecedor: i.fornecedor || null,
      referencia: i.referencia || null,
      nf_entrada: i.nf_entrada || i.nfEntrada || null,
      wbs_element: i.wbs_element || i.wbsElement || null,
      nome_projeto: i.nome_projeto || i.nomeProjeto || null, 
      emissao_nf: i.emissao_nf || i.emissaoNF || null,
      receb_nf: i.receb_nf || i.recebNF || null,
      documento_compras: i.documento_compras || i.docCompras || null,
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

const criarReintegracao = async (solicitante, itens, anexos) => {
  const dados = {
    tipo: 'Reintegracao',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: `[Reintegração] Originado da PL #${solicitante.pl_origem}. ${solicitante.observacoes || ''}`.trim(),
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = (itens || []).map(i => ({
    estoque_id: limparIdEstoque(i.estoque_id || i.id),
    desenho_sap_manual: i.desenho_sap_manual || i.desenhoSAP || '-',
    part_number_manual: i.part_number_manual || i.part_number || '-',
    descricao_manual: i.descricao_manual || i.descricao || 'Sem descrição',
    quantidade_solicitada: Math.max(1, Number(i.quantidade_devolvida || i.quantidade_solicitada || 1)),
    unidade_medida_manual: i.unidade_medida_manual || i.unidade || 'Unid',
    wbs_element: i.wbs_element || null,
    alocacao: i.alocacao || null
  }));

  return await salvarNoBanco(dados, itensDB, anexos);
};

const cancelarPL = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Cancelado',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente',
    filial_origem_id: solicitante.filial_origem || solicitante.filial_id
  };

  const itensDB = (solicitante.itens || []).map(i => ({
    estoque_id: limparIdEstoque(i.estoque_id || i.id),
    desenho_sap_manual: i.desenho_sap_manual || i.desenhoSAP || '-',
    part_number_manual: i.part_number_manual || i.part_number || '-',
    descricao_manual: i.descricao_manual || i.descricao || 'Sem descrição',
    quantidade_solicitada: Math.max(1, Number(i.quantidade_solicitada || 1)),
    unidade_medida_manual: i.unidade_medida_manual || i.unidade || 'Unid'
  }));

  return await salvarNoBanco(dados, itensDB, anexos);
};

const atualizarStatus = async (id, statusRecebido, motivoRecusa, numeroPL) => {
  const { data: solicitacao, error: erroBusca } = await supabase
    .from('solicitacoes')
    .select('tipo, status, filial_origem_id, observacoes, data_aprovacao_pl')
    .eq('id', id)
    .single();

  if (erroBusca || !solicitacao) throw new Error('Solicitação não encontrada.');

  let statusFinal = statusRecebido;

  if (['Entrada', 'Transferencia WBS', 'Cancelado'].includes(solicitacao.tipo) && (statusRecebido === 'Em Separação' || statusRecebido === 'Aprovado' || statusRecebido === 'Concluído')) {
    statusFinal = 'Concluído';
  }

  let atualizacaoPS = { status: statusFinal, updated_at: new Date() };

  const foiAprovado = (statusFinal === 'Em Separação' || statusFinal === 'Concluído');

  if (foiAprovado && !solicitacao.data_aprovacao_pl) {
    const dataAprovacao = new Date();
    atualizacaoPS.data_aprovacao_pl = dataAprovacao;

    const prazoLimite = new Date(dataAprovacao);
    prazoLimite.setDate(prazoLimite.getDate() + 3);
    atualizacaoPS.prazo_finalizacao_pl = prazoLimite;
  }

  if (numeroPL) {
    atualizacaoPS.pl = numeroPL;
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

  let numeroPLGerado = null;

  const acabouDeSerAprovado = solicitacao.status === 'Pendente' && foiAprovado;

  if (!acabouDeSerAprovado && statusFinal === 'Concluído') {
    await supabase.from('packing_lists').update({ status: 'Concluído' }).eq('solicitacao_id', id);
  }

  if (acabouDeSerAprovado) {
    const { data: dadosPL, error: erroPL } = await supabase
      .from('packing_lists')
      .insert([{
        solicitacao_id: id,
        status: statusFinal === 'Concluído' ? 'Concluído' : 'Em Separação'
      }])
      .select('numero_pl')
      .single();

    if (erroPL && erroPL.code !== '23505') throw erroPL;

    if (dadosPL && dadosPL.numero_pl) {
      numeroPLGerado = dadosPL.numero_pl;
      await supabase
        .from('solicitacoes')
        .update({ pl: `PL #${numeroPLGerado}` })
        .eq('id', id);
    }

    const tiposDeSaida = ['Material', 'Transferencia WBS', 'Crossdocking'];

    // 1. LÓGICA DE SUBTRAÇÃO (SAÍDAS)
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
                  nome_projeto: estoqueAtual.nome_projeto || null, 
                  is_transferencia: true,
                  alocacao: `Origem: ${solicitacao.wbs_origem || estoqueAtual.wbs || 'Desconhecida'}`,
                  // ✨ AQUI: CAMPOS FALTANTES QUE DEVEM VIAJAR NA TRANSFERÊNCIA
                  fornecedor: estoqueAtual.fornecedor || null,
                  referencia: estoqueAtual.referencia || null,
                  unidade_medida: estoqueAtual.unidade_medida || 'Unid',
                  emissao_nf: estoqueAtual.emissao_nf || null,
                  receb_nf: estoqueAtual.receb_nf || null,
                  valor_unitario: estoqueAtual.valor_unitario || null,
                  centro: estoqueAtual.centro || null,
                  deposito: estoqueAtual.deposito || null
                };

                await supabase.from('estoque').insert([itemParaNovoWBS]);
              }
            }
          }
        }
      }
    }
    // 2. LÓGICA DE CRIAÇÃO (ENTRADAS) E LIGAÇÃO AO CROSSDOCKING
    else if (solicitacao.tipo === 'Entrada') {
      const { data: itensEntrada } = await supabase
        .from('solicitacoes_itens')
        .select('*')
        .eq('solicitacao_id', id);

      if (itensEntrada && itensEntrada.length > 0) {
        
        // ✨ AQUI: CAMPOS FALTANTES QUE FALTAVAM REGISTRAR NO ESTOQUE!
        const novoEstoqueLotes = itensEntrada.map(item => ({
          material_id: item.material_id || null,
          desenho_sap: item.desenho_sap_manual || item.desenho_sap || '-',
          part_number: item.part_number_manual || 'SEM-PN',
          descricao: item.descricao_manual || 'Sem descrição',
          filial_id: solicitacao.filial_origem_id || null, 
          nf_entrada: item.nf_entrada || 'SEM-NF',
          documento_compras: item.documento_compras || '-',
          wbs: item.wbs_element || '-',
          nome_projeto: item.nome_projeto || null, 
          alocacao: item.alocacao || 'Pendente',
          quantidade_disponivel: item.quantidade_solicitada,
          status: 'Disponível',
          
          fornecedor: item.fornecedor || null,
          referencia: item.referencia || null,
          unidade_medida: item.unidade_medida_manual || 'Unid',
          emissao_nf: item.emissao_nf || null,
          receb_nf: item.receb_nf || null,
          valor_unitario: item.valor_unitario_manual || null,
          centro: item.centro || null,
          deposito: item.deposito || null
        }));

        const { data: estoqueCriado, error: erroEstoque } = await supabase
          .from('estoque')
          .insert(novoEstoqueLotes)
          .select();

        if (erroEstoque) throw erroEstoque;

        // MÁGICA DO CROSSDOCKING
        const nfParaProcurar = itensEntrada[0].nf_entrada;
        
        if (nfParaProcurar && nfParaProcurar !== 'SEM-NF') {
          const { data: crossdockingsPendentes } = await supabase
            .from('solicitacoes')
            .select(`
              id, 
              observacoes,
              notas_fiscais!inner(numero_nf),
              solicitacoes_itens (*)
            `)
            .eq('tipo', 'Crossdocking')
            .eq('notas_fiscais.numero_nf', nfParaProcurar);

          if (crossdockingsPendentes && crossdockingsPendentes.length > 0) {
            for (const cross of crossdockingsPendentes) {
              const isParcial = cross.observacoes && cross.observacoes.includes('[Saída Parcial]');
              
              if (!isParcial) {
                const itensParaCrossdocking = itensEntrada.map((item, index) => ({
                  solicitacao_id: cross.id, 
                  estoque_id: estoqueCriado ? estoqueCriado[index].id : null, 
                  desenho_sap_manual: item.desenho_sap_manual,
                  part_number_manual: item.part_number_manual,
                  descricao_manual: item.descricao_manual,
                  quantidade_solicitada: item.quantidade_solicitada,
                  unidade_medida_manual: item.unidade_medida_manual,
                  valor_unitario_manual: item.valor_unitario_manual,
                  fornecedor: item.fornecedor,
                  referencia: item.referencia,
                  nf_entrada: item.nf_entrada,
                  wbs_element: item.wbs_element,
                  nome_projeto: item.nome_projeto, 
                  centro: item.centro,
                  deposito: item.deposito,
                  alocacao: 'CROSSDOCKING (TOTAL)' 
                }));
                await supabase.from('solicitacoes_itens').insert(itensParaCrossdocking);
              } 
              else {
                const itensPedidosCross = cross.solicitacoes_itens; 
                
                for (const pedido of itensPedidosCross) {
                  const itemEstoqueCriado = estoqueCriado.find(e => 
                    e.desenho_sap !== '-' && 
                    e.desenho_sap.toUpperCase() === pedido.desenho_sap_manual.toUpperCase()
                  );

                  if (itemEstoqueCriado) {
                    await supabase.from('solicitacoes_itens')
                      .update({ 
                        estoque_id: itemEstoqueCriado.id, 
                        alocacao: 'Vinculado à NF (Aguardando Aprovação)' 
                      })
                      .eq('id', pedido.id);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 3. LÓGICA DE DEVOLUÇÃO (REINTEGRAÇÃO E CANCELAMENTO)
    else if (solicitacao.tipo === 'Reintegracao' || solicitacao.tipo === 'Reintegração' || solicitacao.tipo === 'Cancelado') {

      let deveDevolverAoEstoque = true;

      if (solicitacao.tipo === 'Cancelado' && solicitacao.observacoes) {
        const regexUUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        const match = solicitacao.observacoes.match(regexUUID);

        if (match) {
          const idOriginalParaCancelar = match[0];

          const { data: solOriginal } = await supabase
            .from('solicitacoes')
            .select('status')
            .eq('id', idOriginalParaCancelar)
            .single();

          if (solOriginal) {
            if (solOriginal.status === 'Pendente') {
              deveDevolverAoEstoque = false;
            }

            await supabase
              .from('solicitacoes')
              .update({ status: 'Cancelado', updated_at: new Date() })
              .eq('id', idOriginalParaCancelar);

            await supabase
              .from('packing_lists')
              .update({ status: 'Cancelado' })
              .eq('solicitacao_id', idOriginalParaCancelar);
          }
        }
      }

      if (deveDevolverAoEstoque) {
        const { data: itensReintegracao } = await supabase
          .from('solicitacoes_itens')
          .select('estoque_id, quantidade_solicitada')
          .eq('solicitacao_id', id);

        if (itensReintegracao && itensReintegracao.length > 0) {
          for (const item of itensReintegracao) {
            if (item.estoque_id) {
              const { data: estoqueAtual } = await supabase
                .from('estoque')
                .select('quantidade_disponivel')
                .eq('id', item.estoque_id)
                .single();

              if (estoqueAtual) {
                const saldoAtual = Number(estoqueAtual.quantidade_disponivel || 0);
                const quantidadeDevolvida = Number(item.quantidade_solicitada || 0);
                const novoSaldo = saldoAtual + quantidadeDevolvida;

                await supabase
                  .from('estoque')
                  .update({
                    quantidade_disponivel: novoSaldo,
                    status: 'Disponível',
                    updated_at: new Date()
                  })
                  .eq('id', item.estoque_id);
              }
            }
          }
        }
      }
    }
  }

  return { sucesso: true, numeroPL: numeroPLGerado };
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

const reverterItemParaEstoque = async (idItem, qtdDevolver) => {
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

  const qtdRealDevolver = qtdDevolver ? Number(qtdDevolver) : Number(itemPedido.quantidade_solicitada);

  const novaQuantidadeEstoque = Number(itemEstoque.quantidade_disponivel) + qtdRealDevolver;
  const { error: erroUpdateEstoque } = await supabase
    .from('estoque')
    .update({ quantidade_disponivel: novaQuantidadeEstoque, status: 'Disponível' })
    .eq('id', itemEstoque.id);

  if (erroUpdateEstoque) throw erroUpdateEstoque;

  const novaQtdPedido = Number(itemPedido.quantidade_solicitada) - qtdRealDevolver;

  if (novaQtdPedido <= 0) {
    const { error: erroDelete } = await supabase.from('solicitacoes_itens').delete().eq('id', idItem);
    if (erroDelete) throw erroDelete;
  } else {
    const { error: erroUpdatePedido } = await supabase.from('solicitacoes_itens').update({ quantidade_solicitada: novaQtdPedido }).eq('id', idItem);
    if (erroUpdatePedido) throw erroUpdatePedido;
  }

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
  const atualizacaoSol = {};

  if (dadosLocal.filial) {
    atualizacaoSol.filial_origem_id = dadosLocal.filial;
  }

  if (dadosLocal.data_entrega !== undefined) {
    atualizacaoSol.data_entrega = dadosLocal.data_entrega || null;
  }

  if (Object.keys(atualizacaoSol).length > 0) {
    const { error: erroSol } = await supabase
      .from('solicitacoes')
      .update(atualizacaoSol)
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

const atualizarItensDaSolicitacao = async (solicitacaoId, itens) => {
  const { error: erroDelete } = await supabase
    .from('solicitacoes_itens')
    .delete()
    .eq('solicitacao_id', solicitacaoId);

  if (erroDelete) throw erroDelete;

  if (!itens || itens.length === 0) return true;

  const itensDB = itens.map(i => {
    let precoLimpo = 0;
    const valorFront = i.valor_unitario || i.poNetPrice || i.valor_unitario_manual;
    if (valorFront) {
      let v = String(valorFront).replace(/[^\d.,-]/g, '');
      if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
      else if (v.includes(',')) v = v.replace(',', '.');
      precoLimpo = parseFloat(v) || 0;
    }

    return {
      solicitacao_id: solicitacaoId,
      desenho_sap_manual: i.desenho_sap || i.desenhoSAP || i.desenho_sap_manual || null,
      part_number_manual: i.part_number || i.numPecaFabricante || i.part_number_manual || null,
      fornecedor: i.fornecedor || null,
      referencia: i.referencia || null,
      quantidade_solicitada: Math.max(1, Number(i.qtd || i.qtdFornecida || i.quantidade_solicitada || i.quantidade || 1)),
      nf_entrada: i.nf_entrada || i.nfEntrada || null,
      unidade_medida_manual: i.unidade_medida || i.unidadeMedida || i.unidade_medida_manual || 'Unid',
      descricao_manual: i.descricao || i.vendorDescription || i.materialDescription || i.descricao_manual || 'Sem descrição',
      wbs_element: i.wbs_element || i.wbsElement || i.wbs || null,
      nome_projeto: i.nome_projeto || i.nomeProjeto || null, 
      emissao_nf: i.emissao_nf || i.emissaoNF || null,
      receb_nf: i.receb_nf || i.recebNF || null,
      documento_compras: i.documento_compras || i.docCompras || null,
      valor_unitario_manual: precoLimpo,
      centro: i.centro || null,
      deposito: i.deposito || null,
      alocacao: i.alocacao || null
    };
  });

  const { error: erroInsert } = await supabase
    .from('solicitacoes_itens')
    .insert(itensDB);

  if (erroInsert) throw erroInsert;

  return true;
};

const listarDemandasPorEstoque = async (estoqueId) => {
  const { data: demandas, error: erroDemandas } = await supabase
    .from('solicitacoes_itens')
    .select(`
      quantidade_solicitada,
      unidade_medida_manual,
      solicitacoes!inner (
        id, ps, pl, tipo, nome_solicitante, wbs_destino, status, created_at, data_necessidade, data_entrega
      )
    `)
    .eq('estoque_id', estoqueId);

  const { data: edicoes, error: erroEdicoes } = await supabase
    .from('historico_edicoes')
    .select('*')
    .eq('estoque_id', estoqueId);

  if (erroDemandas) throw erroDemandas;
  if (erroEdicoes) throw erroEdicoes;

  return { demandas: demandas || [], edicoes: edicoes || [] };
};

module.exports = {
  listarSolicitacoes,
  criarMaterial,
  criarTransferencia,
  criarEntrada,
  atualizarLocalizacao,
  criarCrossdocking,
  criarNotaFiscal,
  criarReintegracao,
  cancelarPL,
  atualizarStatus,
  deletarAnexo,
  reverterItemParaEstoque,
  buscarHistoricoItem,
  salvarAnexosExtras,
  atualizarItensDaSolicitacao,
  listarDemandasPorEstoque
};