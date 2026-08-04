import React, { useState, useEffect, useContext } from 'react';
import './PainelAprovacao.css';
import { 
  Search, 
  Clock, 
  FileText, 
  Check, 
  X, 
  Eye, 
  Loader2,
  AlertCircle,
  Plus,       
  Trash2,
  Save
} from 'lucide-react';

import { AuthContext } from '../../../contexts/AuthContext'; 

// FUNÇÃO AUXILIAR: Traduz os códigos brutos para os nomes reais dos galpões
const obterNomeFilial = (codigo) => {
  if (!codigo || codigo === '-') return 'N/D';
  
  const codLimpo = String(codigo).toUpperCase().trim();
  
  switch (codLimpo) {
    case "BR02": return "Santo André";
    case "BR04": return "Goiana";
    case "BR06": return "Betim";
    case "TODOS": return "Todas as Filiais";
    default: return codigo; 
  }
};

export default function PainelAprovacao() {
  const { token: tokenContexto, estoqueAtual } = useContext(AuthContext);
  const token = tokenContexto || localStorage.getItem('token'); 

  // --- ESTADOS DO COMPONENTE ---
  const [dadosTabela, setDadosTabela] = useState([]);
  const [estoque, setEstoque] = useState([]); 
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  // --- ESTADOS DA LINHA EXPANDIDA (EDIÇÃO INLINE) ---
  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [solicitacaoSendoEditada, setSolicitacaoSendoEditada] = useState(null);
  const [itensEdicao, setItensEdicao] = useState([]);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [paginaGeral, setPaginaGeral] = useState(1);
  const [paginaEntradas, setPaginaEntradas] = useState(1);
  const itensPorPagina = 5;

  // --- BUSCA INICIAL DOS DADOS ---
  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregando(true);
        const cabecalhosComAuth = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const urlSolicitacoes = `http://localhost:3001/api/solicitacoes/listar?limit=1000&filial=${estoqueAtual || ''}&t=${Date.now()}`;
        const urlEstoque = `http://localhost:3001/api/estoque/listar?t=${Date.now()}`;

        const [resSolicitacoes, resEstoque] = await Promise.all([
          fetch(urlSolicitacoes, { headers: cabecalhosComAuth, cache: 'no-store' }),
          fetch(urlEstoque, { headers: cabecalhosComAuth, cache: 'no-store' })
        ]);

        const resultadoSol = await resSolicitacoes.json();
        const resultadoEst = await resEstoque.json();

        if (resEstoque.ok && resultadoEst.sucesso) {
          setEstoque(resultadoEst.dados);
        }

        if (resSolicitacoes.ok && resultadoSol.sucesso) {
          const dadosFormatados = resultadoSol.dados
            .filter(item => item.status === 'Pendente')
            .map((item) => {
              let valorTotal = 0;
              let centro = '-';
              let dep = '-';
              
              if (String(item.tipo).trim() === 'Entrada' && item.itens && item.itens.length > 0) {
                // Suporta tanto o nome 'quantidade_solicitada' quanto 'qtdFornecida'
                valorTotal = item.itens.reduce((acc, it) => acc + (Number(it.quantidade_solicitada || it.qtdFornecida || it.quantidade || 0) * Number(it.valor_unitario_manual || 0)), 0);
                centro = item.itens[0].centro || 'BR06';
                dep = item.itens[0].deposito || '0020';
              }

              return {
                ...item,
                idOriginal: item.id, 
                ps: item.ps || 'PS-Pendente', 
                bs: item.bs || null,           
                dataSolicitacao: item.dataSolicitacao || '-',
                valorTotalFormatado: valorTotal > 0 ? `R$ ${valorTotal.toFixed(2)}` : null,
                centro,
                deposito: dep,
                filial: item.filial || '-' 
              };
            });

          setDadosTabela(dadosFormatados);
        }
      } catch (error) {
        console.error("Falha ao conectar à API do NexusLog:", error.message);
      } finally {
        setCarregando(false);
      }
    };

    if (token) {
      buscarDados();
    } else {
      setCarregando(false);
    }
  }, [token, estoqueAtual]);

  const dadosFiltrados = dadosTabela.filter((linha) => {
    if (!termoPesquisa) return true; 
    const termoLower = termoPesquisa.toLowerCase();
    return (
      (linha.ps && linha.ps.toLowerCase().includes(termoLower)) ||
      (linha.solicitante && linha.solicitante.toLowerCase().includes(termoLower)) ||
      (linha.wbs && linha.wbs.toLowerCase().includes(termoLower)) ||
      (linha.filial && linha.filial.toLowerCase().includes(termoLower)) 
    );
  });

  const entradasPendentes = dadosFiltrados.filter(item => String(item.tipo).trim() === 'Entrada');
  const outrasPendentes = dadosFiltrados.filter(item => String(item.tipo).trim() !== 'Entrada');

  const totalPaginasGeral = Math.max(1, Math.ceil(outrasPendentes.length / itensPorPagina));
  const indexPrimeiroGeral = (paginaGeral - 1) * itensPorPagina;
  const indexUltimoGeral = paginaGeral * itensPorPagina;
  const outrasPendentesPaginadas = outrasPendentes.slice(indexPrimeiroGeral, indexUltimoGeral);

  const totalPaginasEntradas = Math.max(1, Math.ceil(entradasPendentes.length / itensPorPagina));
  const indexPrimeiroEntradas = (paginaEntradas - 1) * itensPorPagina;
  const indexUltimoEntradas = paginaEntradas * itensPorPagina;
  const entradasPendentesPaginadas = entradasPendentes.slice(indexPrimeiroEntradas, indexUltimoEntradas);

  // --- LÓGICA DE ABRIR A LINHA PARA EDIÇÃO INLINE ---
  const toggleLinha = (idUnico, linha) => {
    if (linhaExpandida === idUnico) {
      setLinhaExpandida(null);
      setSolicitacaoSendoEditada(null);
      setItensEdicao([]);
    } else {
      setLinhaExpandida(idUnico);
      setSolicitacaoSendoEditada(linha);
      setItensEdicao(linha.itens ? JSON.parse(JSON.stringify(linha.itens)) : []);
    }
  };

  // --- FUNÇÕES DE MANIPULAÇÃO DA TABELA INLINE ---
  const adicionarLinhaItem = () => {
    setItensEdicao([...itensEdicao, {
      id_temporario: `novo-${Date.now()}`,
      numPecaFabricante: '',
      fornecedor: '',
      qtdFornecida: 1,
      nfEntrada: '',
      unidadeMedida: 'Unid',
      vendorDescription: '',
      wbsElement: '',
      dataNecessidade: '', 
      emissaoNF: '',
      recebNF: '',
      docCompras: '',
      poNetPrice: '',
      centro: '',
      deposito: '',
      alocacao: ''
    }]);
  };

  const removerLinhaItem = (indexParaRemover) => {
    setItensEdicao(itensEdicao.filter((_, index) => index !== indexParaRemover));
  };

  const atualizarCampoItem = (index, campo, valor) => {
    const novosItens = [...itensEdicao];
    novosItens[index][campo] = valor;
    setItensEdicao(novosItens);
  };

  // --- SALVAR A EDIÇÃO ---
  const salvarEdicaoItens = async () => {
    if (!solicitacaoSendoEditada) return;

    try {
      setDadosTabela(prev => prev.map(item => {
        if (item.idOriginal === solicitacaoSendoEditada.idOriginal) {
          return { ...item, itens: itensEdicao };
        }
        return item;
      }));
      
      setLinhaExpandida(null);

      const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${solicitacaoSendoEditada.idOriginal}/itens`, {
        method: 'PATCH', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ itens: itensEdicao })
      });

      if (!resposta.ok) {
        console.warn("O servidor recusou a atualização dos itens.");
      }
    } catch (error) {
      console.error('Erro de rede ao tentar atualizar os itens:', error);
    }
  };

  // --- AÇÕES GERAIS ---
  const handleAprovar = async (e, idOriginal) => {
    e.stopPropagation();
    if (window.confirm(`Aprovar esta solicitação?`)) {
      try {
        const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idOriginal}/status`, {
          method: 'PATCH', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Em Separação' }) 
        });
        if (resposta.ok) {
          setDadosTabela(prev => prev.filter(item => item.idOriginal !== idOriginal));
          setLinhaExpandida(null);
        }
      } catch (error) {
        console.error("Erro na aprovação:", error);
      }
    }
  };

  const handleRecusar = async (e, idOriginal) => {
    e.stopPropagation();
    const motivo = window.prompt(`Motivo da recusa para esta solicitação?`);
    if (motivo) {
      try {
        const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idOriginal}/status`, {
          method: 'PATCH', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Recusado', motivo_recusa: motivo }) 
        });
        if (resposta.ok) {
          setDadosTabela(prev => prev.filter(item => item.idOriginal !== idOriginal));
          setLinhaExpandida(null);
        }
      } catch (error) {
        console.error("Erro na recusa:", error);
      }
    }
  };

  // ✨ COMPONENTE REUTILIZÁVEL: GAVETA DE EDIÇÃO COMPLETA ✨
  const renderizarGavetaEdicao = () => (
    <div className="gaveta-detalhes" style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#0284c7" /> Itens da Solicitação (Modo de Edição)
        </h4>
        <button 
          onClick={adicionarLinhaItem}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={14} /> Adicionar Nova Linha
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '2200px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', textAlign: 'center', width: '60px' }}>AÇÕES</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>Nº PEÇA FABRICANTE</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>FORNECEDOR</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', width: '120px' }}>QTD. FORNECIDA</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>NF DE ENTRADA</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', width: '140px' }}>UNIDADE DE MEDIDA</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', minWidth: '200px' }}>VENDOR DESCRIPTION</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>WBS ELEMENT</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>DATA DE NECESSIDADE</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>EMISSÃO NF</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>RECEB. NF</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>DOCUMENTO DE COMPRAS</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>PO NET PRICE</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', width: '100px' }}>CENTRO</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', width: '100px' }}>DEPÓSITO</th>
              <th style={{ padding: '8px', fontSize: '0.75rem', color: '#475569' }}>ALOCAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {itensEdicao.map((item, index) => (
              <tr key={item.id || item.id_temporario || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <button onClick={() => removerLinhaItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Remover linha">
                    <Trash2 size={16} />
                  </button>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.numPecaFabricante || item.part_number || ''} onChange={(e) => atualizarCampoItem(index, 'numPecaFabricante', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="PN" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.fornecedor || ''} onChange={(e) => atualizarCampoItem(index, 'fornecedor', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Fornecedor" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="number" value={item.qtdFornecida || item.quantidade_solicitada || item.quantidade || 1} onChange={(e) => atualizarCampoItem(index, 'qtdFornecida', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} min="1" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.nfEntrada || ''} onChange={(e) => atualizarCampoItem(index, 'nfEntrada', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="NF Entrada" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <select value={item.unidadeMedida || 'Unid'} onChange={(e) => atualizarCampoItem(index, 'unidadeMedida', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <option value="Unid">Unid</option>
                    <option value="Kg">Kg</option>
                    <option value="Metro">Metro</option>
                    <option value="Caixa">Caixa</option>
                    <option value="Litro">Litro</option>
                    <option value="NR">NR</option>
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.vendorDescription || item.materialDescription || ''} onChange={(e) => atualizarCampoItem(index, 'vendorDescription', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Descrição do fornecedor" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.wbsElement || ''} onChange={(e) => atualizarCampoItem(index, 'wbsElement', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="WBS" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="date" value={item.dataNecessidade || ''} onChange={(e) => atualizarCampoItem(index, 'dataNecessidade', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="date" value={item.emissaoNF || ''} onChange={(e) => atualizarCampoItem(index, 'emissaoNF', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="date" value={item.recebNF || ''} onChange={(e) => atualizarCampoItem(index, 'recebNF', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.docCompras || ''} onChange={(e) => atualizarCampoItem(index, 'docCompras', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Doc Compras" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.poNetPrice || ''} onChange={(e) => atualizarCampoItem(index, 'poNetPrice', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="R$ 0,00" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.centro || ''} onChange={(e) => atualizarCampoItem(index, 'centro', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Centro" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.deposito || ''} onChange={(e) => atualizarCampoItem(index, 'deposito', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Depósito" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input type="text" value={item.alocacao || ''} onChange={(e) => atualizarCampoItem(index, 'alocacao', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} placeholder="Alocação" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {itensEdicao.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.875rem' }}>
            Não existem itens nesta solicitação. Adicione uma nova linha.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button 
          onClick={() => toggleLinha(linhaExpandida, solicitacaoSendoEditada)}
          style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Cancelar
        </button>
        <button 
          onClick={salvarEdicaoItens}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0284c7', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Save size={16} /> Guardar Alterações
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      <header className="acompanhamento-cabecalho">
        <h1>Painel de Aprovação</h1>
        <p>Analise e aprove as solicitações pendentes para dar andamento à operação.</p>
      </header>

      <div className="pesquisa-wrapper-direita">
        <Search className="icone-pesquisa-dir" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por PS, WBS, Filial ou Solicitante..." 
          value={termoPesquisa} 
          onChange={(e) => setTermoPesquisa(e.target.value)} 
        />
      </div>

      {carregando ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#94a3b8' }}>
          <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
          <span>Carregando solicitações...</span>
        </div>
      ) : (
        <>
          {/* SECÇÃO 1: SOLICITAÇÕES GERAIS */}
          <div className="seccao-painel tema-amarelo">
            <div className="seccao-header borda-amarela">
              <div className="seccao-titulo amarelo">
                <Clock size={20} />
                Solicitações Pendentes
              </div>
              <span className="badge-contagem-seccao amarelo">{outrasPendentes.length}</span>
            </div>

            {outrasPendentes.length === 0 ? (
              <div className="estado-vazio-seccao">
                <div className="circulo-check verde-claro">
                  <Check size={24} />
                </div>
                <span>Nenhuma solicitação pendente</span>
              </div>
            ) : (
              <div className="lista-solicitacoes">
                {outrasPendentesPaginadas.map((linha) => {
                  const idUnico = `geral-${linha.idOriginal}`;
                  const isExpandida = linhaExpandida === idUnico;
                  const isCrossdocking = linha.tipo === 'Crossdocking';
                  let nfNoEstoque = true; 

                  if (isCrossdocking && linha.nfCrossdocking) {
                    nfNoEstoque = estoque.some(itemEstoque => itemEstoque.nf_entrada === linha.nfCrossdocking);
                  }

                  return (
                    <React.Fragment key={idUnico}>
                      <div className="item-lista-horizontal">
                        <div className="item-info-principal">
                          <div className="item-linha-id">
                            {linha.ps}
                            <span className="badge-tipo-lista azul">{linha.tipo}</span>
                          </div>
                          <div className="item-meta-info">
                            WBS: <a href="#" className="link-wbs">{linha.wbs}</a> &middot;
                            {linha.itens?.length || 0} itens &middot;
                            {linha.solicitante}
                          </div>
                        </div>

                        <div className="item-acoes-grupo">
                          <button className="btn-acao-lista btn-ver-itens" onClick={() => toggleLinha(idUnico, linha)}>
                            <Eye size={16} /> {isExpandida ? "Fechar Itens" : "Ver / Editar Itens"}
                          </button>

                          {isCrossdocking && !nfNoEstoque ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', marginLeft: '12px' }}>
                              <AlertCircle size={16} /> Aguardando NF {linha.nfCrossdocking}
                            </div>
                          ) : (
                            <>
                              <button className="btn-acao-lista btn-recusar-outline" onClick={(e) => handleRecusar(e, linha.idOriginal)}>
                                <X size={16} /> Recusar
                              </button>
                              <button className="btn-acao-lista btn-aprovar-solid btn-atualizado-azul" onClick={(e) => handleAprovar(e, linha.idOriginal)}>
                                <Check size={16} /> Aprovar
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpandida && renderizarGavetaEdicao()}
                      
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECÇÃO 2: ENTRADAS DE ESTOQUE */}
          <div className="seccao-painel tema-verde">
            <div className="seccao-header borda-verde">
              <div className="seccao-titulo verde">
                <FileText size={20} />
                Entradas de Estoque Pendentes
              </div>
              <span className="badge-contagem-seccao verde">{entradasPendentes.length}</span>
            </div>

            {entradasPendentes.length === 0 ? (
              <div className="estado-vazio-seccao">
                <div className="circulo-check verde-claro">
                  <Check size={24} />
                </div>
                <span>Nenhuma entrada pendente</span>
              </div>
            ) : (
              <div className="lista-solicitacoes">
                {entradasPendentesPaginadas.map((linha) => {
                  const idUnico = `entrada-${linha.idOriginal}`;
                  const isExpandida = linhaExpandida === idUnico;
                  
                  return (
                    <React.Fragment key={idUnico}>
                      <div className="item-lista-horizontal">
                        <div className="item-info-principal">
                          <div className="item-linha-id">
                            {linha.ps}
                            <span className="badge-tipo-lista verde">Entrada</span>
                          </div>
                          <div className="item-meta-info">
                            WBS: <a href="#" className="link-wbs">{linha.wbs}</a> &middot;
                            {linha.itens?.length || 0} itens &middot;
                            {linha.solicitante}
                          </div>
                        </div>

                        <div className="item-acoes-grupo">
                          <button className="btn-acao-lista btn-ver-itens" onClick={() => toggleLinha(idUnico, linha)}>
                            <Eye size={16} /> {isExpandida ? "Fechar Itens" : "Ver / Editar Itens"}
                          </button>
                          
                          <button className="btn-acao-lista btn-recusar-outline" onClick={(e) => handleRecusar(e, linha.idOriginal)}>
                            <X size={16} /> Recusar
                          </button>
                          <button className="btn-acao-lista btn-aprovar-solid" onClick={(e) => handleAprovar(e, linha.idOriginal)}>
                            <Check size={16} /> Aprovar
                          </button>
                        </div>
                      </div>

                      {isExpandida && renderizarGavetaEdicao()}

                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}