// src/services/solicitacoesService.js
const supabase = require('../config/supabase');

// --- 🛠️ FUNÇÃO AUXILIAR: Validador de ID ---
// Se o ID for uma string gerada pelo frontend (ex: "manual-123"), ele devolve null
const limparIdEstoque = (id) => {
  if (!id) return null;
  const idString = String(id);
  if (idString.startsWith('manual-')) return null;
  return idString;
};

// --- 🛠️ FUNÇÃO AUXILIAR: Salva no Banco ---
// Reparar que agora temos um 4º parâmetro aqui: numeroDaNota
const salvarNoBanco = async (dadosPrincipais, itensArray, anexosArray = [], numeroDaNota = null) => {
  const psId = `PS-${Date.now()}`;
  console.log(`💾 Iniciando gravação da solicitação: ${psId}`);

  // 1. Salva a Solicitação (PS)
  console.log("-> 1/4: Tentando gravar na tabela 'solicitacoes'...");
  const { error: erroPS } = await supabase.from('solicitacoes').insert([{
    id: psId,
    ...dadosPrincipais
  }]);

  if (erroPS) {
    console.error("❌ Erro na tabela 'solicitacoes':", erroPS);
    throw erroPS;
  }

  // 2. Salva os Itens (se existirem)
  if (itensArray && itensArray.length > 0) {
    console.log(`-> 2/4: Tentando gravar ${itensArray.length} item(ns) na tabela 'solicitacoes_itens'...`);
    const itensParaInserir = itensArray.map(item => ({
      solicitacao_id: psId,
      ...item
    }));
    
    const { error: erroItens } = await supabase.from('solicitacoes_itens').insert(itensParaInserir);
    
    if (erroItens) {
      console.error("❌ Erro na tabela 'solicitacoes_itens':", erroItens);
      throw erroItens;
    }
  } else {
    console.log("-> 2/4: Nenhum item para gravar.");
  }

  // 3. Salva os Anexos
  if (anexosArray && anexosArray.length > 0) {
    console.log(`-> 3/4: Tentando gravar ${anexosArray.length} anexo(s) na tabela 'anexos'...`);
    const anexosParaInserir = anexosArray.map(anexo => ({
      solicitacao_id: psId,
      nome_arquivo: anexo.nome_arquivo,
      url_arquivo: anexo.url_arquivo
    }));
    const { error: erroAnexos } = await supabase.from('anexos').insert(anexosParaInserir);
    if (erroAnexos) {
      console.error("❌ Erro na tabela 'anexos':", erroAnexos);
      throw erroAnexos;
    }
  } else {
    console.log("-> 3/4: Nenhum anexo para gravar.");
  }

  // =======================================================
  // 4. ✨ AQUI ESTÁ O CÓDIGO NOVO: Salva a Nota Fiscal
  // =======================================================
  if (numeroDaNota) {
    console.log(`-> 4/4: Tentando gravar a Nota Fiscal ${numeroDaNota} na tabela 'notas_fiscais'...`);
    const { error: erroNF } = await supabase.from('notas_fiscais').insert([{
      solicitacao_id: psId,
      numero_nf: numeroDaNota // Mantivemos numero_nf porque é assim que está no teu Banco de Dados!
    }]);

    if (erroNF) {
      console.error("❌ Erro na tabela 'notas_fiscais':", erroNF);
      throw erroNF;
    }
  } else {
    console.log("-> 4/4: Nenhuma nota fiscal para gravar à parte.");
  }

  return psId;
};



// =========================================================
// 🚀 SERVIÇOS ESPECÍFICOS POR TIPO DE SOLICITAÇÃO
// =========================================================

const listarSolicitacoes = async () => {
  const { data, error } = await supabase
    .from('solicitacoes')
    // 👇 ADICIONA O 'notas_fiscais (numero_nf)' AQUI NESTA LINHA
    .select(`id, tipo, nome_solicitante, wbs_destino, wbs_origem, observacoes, data_necessidade, entrega_urgente, status, created_at, boletins_saida (numero_bs), notas_fiscais (numero_nf), anexos (id, nome_arquivo, url_arquivo, origem), solicitacoes_itens (*)`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(sol => {

    let numeroBS = null;
    if (sol.boletins_saida) {
      if (Array.isArray(sol.boletins_saida) && sol.boletins_saida.length > 0) {
        numeroBS = sol.boletins_saida[0].numero_bs;
      }
      else if (!Array.isArray(sol.boletins_saida) && sol.boletins_saida.numero_bs) {
        numeroBS = sol.boletins_saida.numero_bs;
      }
    }

    return {
      id: sol.id,
      tipo: sol.tipo,
      // 👇 ADICIONA ESTA LINHA PARA ENVIAR A NF PARA O REACT
      nfCrossdocking: sol.notas_fiscais && sol.notas_fiscais.length > 0 ? sol.notas_fiscais[0].numero_nf : (sol.notas_fiscais?.numero_nf || null),
      solicitante: sol.nome_solicitante || 'Não informado',
      // ... resto do teu código ...
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      bs: numeroBS ? `BS #${numeroBS}` : null,
      dataSolicitacao: new Date(sol.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(sol.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dataEntrega: sol.status === 'Concluído' ? 'Disponível' : null,
      status: sol.status,
      observacoes: sol.observacoes,
      entregaUrgente: sol.entrega_urgente,
      anexos: sol.anexos || [],
      itens: sol.solicitacoes_itens || []
    };
  });
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
    status: 'Pendente'
  };

  const itensDB = itens.map(i => ({
    // 👇 Aplicamos o nosso "guarda-costas" aqui:
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
    status: 'Pendente'
  };

  const itensDB = itens.map(i => ({
    // 👇 Aplicamos o nosso "guarda-costas" aqui também:
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
    status: 'Pendente'
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
    status: 'Pendente'
  };

  const itensDB = (itens || []).map(i => ({
    desenho_sap_manual: i.desenho_sap_manual,
    quantidade_solicitada: Math.max(1, i.quantidade_solicitada || 1),
    unidade_medida_manual: i.unidade_medida_manual
  }));

  // O 4º parâmetro (solicitante.nf) é passado aqui!
  return await salvarNoBanco(dados, itensDB, anexos, solicitante.nf);
};

const criarNotaFiscal = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Nota Fiscal',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente'
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
    status: 'Pendente'
  };
  return await salvarNoBanco(dados, [], anexos);
};

const cancelarBS = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Crossdocking',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Cancelado'
  };
  return await salvarNoBanco(dados, [], anexos);
};

// =========================================================
// 🔄 ATUALIZAÇÃO DE STATUS E MATEMÁTICA DE ESTOQUE
// =========================================================
const atualizarStatus = async (id, statusRecebido, motivoRecusa) => {

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

  if (foiAprovado) {

    if (solicitacao.tipo !== 'Entrada') {
      const { error: erroBS } = await supabase
        .from('boletins_saida')
        .insert([{
          solicitacao_id: id,
          status: statusFinal === 'Concluído' ? 'Concluído' : 'Em Separação'
        }]);

      if (erroBS && erroBS.code !== '23505') throw erroBS;
    }

    const tiposDeSaida = ['Material', 'Transferencia WBS', 'Crossdocking'];

    // CASO 1: É UMA SAÍDA OU TRANSFERÊNCIA
    if (tiposDeSaida.includes(solicitacao.tipo)) {

      const { data: itensPedidos } = await supabase
        .from('solicitacoes_itens')
        .select('estoque_id, quantidade_solicitada')
        .eq('solicitacao_id', id);

      if (itensPedidos && itensPedidos.length > 0) {
        for (const item of itensPedidos) {
          if (item.estoque_id) {
            
            // 👇 Buscamos todos os dados do material na prateleira original (*)
            const { data: estoqueAtual } = await supabase
              .from('estoque')
              .select('*')
              .eq('id', item.estoque_id)
              .single();

            if (estoqueAtual) {
              // --- PARTE A: ABATER O SALDO DA ORIGEM ---
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

// ... código anterior ...

              // --- PARTE B: CRIAR A NOVA LINHA NO ESTOQUE SE FOR TRANSFERÊNCIA ---
              if (solicitacao.tipo === 'Transferencia WBS') {
                console.log(`🔄 [TRANSFERÊNCIA] Criando nova entrada para o WBS: ${solicitacao.wbs_destino}`);
                
                const itemParaNovoWBS = {
                  material_id: estoqueAtual.material_id,
                  filial_id: estoqueAtual.filial_id,
                  
                  // 🛠️ INCLUÍMOS O DESENHO SAP AQUI
                  desenho_sap: estoqueAtual.desenho_sap, 
                  
                  part_number: estoqueAtual.part_number,
                  descricao: estoqueAtual.descricao,
                  nf_entrada: estoqueAtual.nf_entrada,
                  documento_compras: estoqueAtual.documento_compras,
                  
                  // Novos dados para o destino
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

    // CASO 2: É UMA ENTRADA (Temos de criar novos saldos na prateleira)
    else if (solicitacao.tipo === 'Entrada') {
      console.log("🛠️ [BACKEND - ETAPA 1] Solicitação é do tipo Entrada. A procurar itens da solicitação...");

      const { data: itensEntrada, error: erroBuscaItens } = await supabase
        .from('solicitacoes_itens')
        .select('*')
        .eq('solicitacao_id', id);

      if (erroBuscaItens) {
        console.error("❌ [BACKEND - ERRO] Falha ao procurar itens da solicitação:", erroBuscaItens);
      }

      console.log("🛠️ [BACKEND - ETAPA 2] Itens encontrados para a Entrada:", itensEntrada);

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

        console.log("🛠️ [BACKEND - ETAPA 3] Objeto montado para inserir no Estoque:", novoEstoqueLotes);

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

  return true;
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
  salvarAnexosExtras
};