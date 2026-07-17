// src/services/solicitacoesService.js
const supabase = require('../config/supabase');

// --- 🛠️ FUNÇÃO AUXILIAR: Salva no Banco ---
const salvarNoBanco = async (dadosPrincipais, itensArray, anexosArray = []) => {
  const psId = `PS-${Date.now()}`;
  
  // 1. Salva a Solicitação (PS)
  const { error: erroPS } = await supabase.from('solicitacoes').insert([{ 
    id: psId, 
    ...dadosPrincipais 
  }]);
  
  if (erroPS) throw erroPS;

  // 2. Salva os Itens (se existirem)
  if (itensArray && itensArray.length > 0) {
    const itensParaInserir = itensArray.map(item => ({
      solicitacao_id: psId,
      ...item
    }));
    const { error: erroItens } = await supabase.from('solicitacoes_itens').insert(itensParaInserir);
    if (erroItens) throw erroItens;
  }

  // 3. Salva os Anexos
  if (anexosArray && anexosArray.length > 0) {
    const anexosParaInserir = anexosArray.map(anexo => ({
      solicitacao_id: psId,
      nome_arquivo: anexo.nome_arquivo,
      url_arquivo: anexo.url_arquivo
    }));
    const { error: erroAnexos } = await supabase.from('anexos').insert(anexosParaInserir);
    if (erroAnexos) throw erroAnexos;
  }

  return psId;
};


// =========================================================
// 🚀 SERVIÇOS ESPECÍFICOS POR TIPO DE SOLICITAÇÃO
// =========================================================

// Dentro da função listarSolicitacoes, atualiza o .select para este:
const listarSolicitacoes = async () => {
  const { data, error } = await supabase
    .from('solicitacoes')
    // 👇 ADICIONAMOS O 'id' e a 'origem' DENTRO DOS ANEXOS
    .select(`id, tipo, nome_solicitante, wbs_destino, wbs_origem, observacoes, data_necessidade, entrega_urgente, status, created_at, boletins_saida (numero_bs), anexos (id, nome_arquivo, url_arquivo, origem), solicitacoes_itens (*)`)
    .order('created_at', { ascending: false });
    
  // ... resto do código mantém-se igual ...

  if (error) throw error;

  return data.map(sol => {
    
    // 👇 A MÁGICA DA CORREÇÃO: Lemos o BS de forma inteligente
    let numeroBS = null;
    if (sol.boletins_saida) {
      // Se vier como Array (lista)
      if (Array.isArray(sol.boletins_saida) && sol.boletins_saida.length > 0) {
        numeroBS = sol.boletins_saida[0].numero_bs;
      } 
      // Se vier como Objeto único (O novo padrão do Supabase graças ao UNIQUE)
      else if (!Array.isArray(sol.boletins_saida) && sol.boletins_saida.numero_bs) {
        numeroBS = sol.boletins_saida.numero_bs;
      }
    }

    return {
      id: sol.id,
      tipo: sol.tipo,
      solicitante: sol.nome_solicitante || 'Não informado',
      wbs: sol.tipo === 'Transferencia WBS' ? `${sol.wbs_origem} ➔ ${sol.wbs_destino}` : sol.wbs_destino || '—',
      
      // 👇 Usamos a variável inteligente que criámos acima
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
    // Tenta formatar o PO Net Price se existir (Ex: R$ 1.500,00 -> 1500.00)
    let precoLimpo = 0;
    if (i.poNetPrice) {
      let v = String(i.poNetPrice).replace(/[^\d.,-]/g, '');
      if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
      else if (v.includes(',')) v = v.replace(',', '.');
      precoLimpo = parseFloat(v) || 0;
    }

    return {
      // --- CAMPOS BASE ---
      desenho_sap_manual: i.desenhoSAP || '-',
      part_number_manual: i.numPecaFabricante,
      descricao_manual: i.materialDescription || i.vendorDescription || 'Sem descrição',
      quantidade_solicitada: Math.max(1, i.qtd || i.qtdFornecida || 1),
      unidade_medida_manual: i.unidadeMedida || 'Unid',
      valor_unitario_manual: precoLimpo,

      // 👇 NOVOS CAMPOS SAP ADICIONADOS AQUI 👇
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

  return await salvarNoBanco(dados, itensDB, anexos);
};

const criarNotaFiscal = async (solicitante, anexos) => {
  const dados = {
    tipo: 'Nota Fiscal',
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Pendente'
  };

  // Limpa a formatação de dinheiro
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
    tipo: 'Crossdocking', // Usamos este tipo para respeitar o CHECK da base de dados
    nome_solicitante: solicitante.nome,
    wbs_destino: solicitante.wbs,
    observacoes: solicitante.observacoes,
    status: 'Cancelado'
  };
  return await salvarNoBanco(dados, [], anexos);
};

// =========================================================
// 🔄 ATUALIZAÇÃO DE STATUS E GERAÇÃO AUTOMÁTICA DE BS
// =========================================================
const atualizarStatus = async (id, novoStatus, motivoRecusa) => {
  
  // 1. Prepara a atualização da Solicitação
  let atualizacaoPS = { status: novoStatus, updated_at: new Date() };

  // Se foi recusado, guardamos o motivo nas observações para não perder o histórico
  if (motivoRecusa) {
    const { data: sol } = await supabase.from('solicitacoes').select('observacoes').eq('id', id).single();
    const obsAntiga = sol?.observacoes || '';
    atualizacaoPS.observacoes = `${obsAntiga}\n[RECUSADO]: ${motivoRecusa}`.trim();
  }

  // Atualiza a PS no banco
  const { error: erroPS } = await supabase
    .from('solicitacoes')
    .update(atualizacaoPS)
    .eq('id', id);

  if (erroPS) throw erroPS;

  // 2. SE FOI APROVADO, GERA O BS AUTOMATICAMENTE!
  if (novoStatus === 'Em Separação') {
    const { error: erroBS } = await supabase
      .from('boletins_saida')
      .insert([{ 
        solicitacao_id: id, 
        status: 'Em Separação'
        // NOTA: Assumo que alteraste o 'id' do boletim_saida para 'numero_bs SERIAL' no SQL
        // como te aconselhei antes. Assim, o banco cria o número sozinho!
      }]);

    // O código 23505 significa que já existe (para evitar duplicações caso alguém clique 2x)
    if (erroBS && erroBS.code !== '23505') throw erroBS;
  }

  return true;
};

// Adiciona esta nova função antes do module.exports no ficheiro src/services/solicitacoesService.js

const salvarAnexosExtras = async (solicitacaoId, anexosArray) => {
  if (!anexosArray || anexosArray.length === 0) return false;

  // Mapeamos os anexos injetando a origem como 'logistica' para o componente saber diferenciar
  const anexosParaInserir = anexosArray.map(anexo => ({
    solicitacao_id: solicitacaoId,
    nome_arquivo: anexo.nome_arquivo,
    url_arquivo: anexo.url_arquivo,
    origem: 'logistica' // 👈 Crucial para o teu filtro do frontend funcionar perfeitamente!
  }));

  const { error } = await supabase.from('anexos').insert(anexosParaInserir);
  if (error) throw error;

  return true;
};

const deletarAnexo = async (anexoId) => {
  // 1. Busca os dados do anexo para sabermos a URL no Storage
  const { data: anexo } = await supabase.from('anexos').select('*').eq('id', anexoId).single();
  
  if (anexo && anexo.url_arquivo) {
    // 2. Extrai o caminho físico e apaga do bucket 'documentos'
    const urlParts = anexo.url_arquivo.split('/documentos/');
    if (urlParts.length > 1) {
      await supabase.storage.from('documentos').remove([urlParts[1]]);
    }
  }

  // 3. Apaga a linha da base de dados
  const { error } = await supabase.from('anexos').delete().eq('id', anexoId);
  if (error) throw error;
  
  return true;
};



// Certifica-te de atualizar o module.exports no final do ficheiro para incluir a nova função:
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
  salvarAnexosExtras // 👈 ADICIONADO AQUI!
};