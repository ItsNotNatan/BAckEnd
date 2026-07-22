import React, { useState, useEffect } from 'react';
import './PainelGeralSolicitacoes.css';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  GitBranch,
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle
} from 'lucide-react';

const filtrosArray = ['Todos', 'Material', 'Transferencia WBS', 'Nota Fiscal', 'Entrada', 'Crossdocking', 'Reintegracao'];

const renderBadgeStatus = (status) => {
  switch (status) {
    case 'Em Separação':
      return (
        <span className="badge-status status-separacao">
          <RefreshCw size={14} /> Em Separação
        </span>
      );
    case 'Pendente':
      return (
        <span className="badge-status status-pendente" style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          Pendente
        </span>
      );
    case 'Concluído':
      return (
        <span className="badge-status status-concluido">
          <CheckCircle2 size={14} /> Concluído
        </span>
      );
    case 'Cancelado':
    case 'Recusado':
      return (
        <span className="badge-status status-cancelado">
          <XCircle size={14} /> {status}
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export default function PainelGeralSolicitacoes() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // 📄 CONTROLE DE PAGINAÇÃO REAL (10 por vez)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0); 
  const itensPorPagina = 10; 

  // ✨ BUSCA DADOS PAGINADOS DO BACKEND
  useEffect(() => {
    const buscarDadosPaginados = async () => {
      try {
        setCarregando(true);

        const tipoFiltro = filtroAtivo === 'Transfer. WBS' ? 'Transferencia WBS' : filtroAtivo;
        const urlSolicitacoes = `http://localhost:3001/api/solicitacoes/listar?page=${paginaAtual}&limit=${itensPorPagina}&busca=${termoPesquisa}&tipo=${tipoFiltro !== 'Todos' ? tipoFiltro : ''}`;

        const [resSolicitacoes, resEstoque] = await Promise.all([
          fetch(urlSolicitacoes),
          fetch('http://localhost:3001/api/estoque/listar')
        ]);

        const resultadoSol = await resSolicitacoes.json();
        const resultadoEst = await resEstoque.json();

        if (resEstoque.ok && resultadoEst.sucesso) {
          setEstoque(resultadoEst.dados);
        }

        if (resSolicitacoes.ok && resultadoSol.sucesso) {
          const dadosFormatados = resultadoSol.dados.map(item => ({
            ...item,
            idNumerico: item.id.replace(/\D/g, '') || item.id,
            dataCriacaoFormatada: item.dataSolicitacao || new Date(item.created_at).toLocaleDateString('pt-BR'),
            nfCrossdocking: item.notas_fiscais && item.notas_fiscais.length > 0 ? item.notas_fiscais[0].numero_nf : (item.notas_fiscais?.numero_nf || null)
          }));
          
          setSolicitacoes(dadosFormatados);
          setTotalRegistros(resultadoSol.total || resultadoSol.dados.length); 
        }
      } catch (error) {
        console.error("Erro ao buscar dados paginados:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDadosPaginados();
  }, [paginaAtual, filtroAtivo, termoPesquisa]);

  const lidarComMudancaFiltro = (novoFiltro) => {
    setFiltroAtivo(novoFiltro);
    setPaginaAtual(1);
  };

  const lidarComMudancaPesquisa = (e) => {
    setTermoPesquisa(e.target.value);
    setPaginaAtual(1);
  };

  const lidarComMudancaStatus = async (idSolicitacao, novoStatus) => {
    if (!window.confirm(`Tem certeza que deseja mudar o status da solicitação ${idSolicitacao} para "${novoStatus}"?`)) {
      return;
    }

    let motivo = null;
    if (novoStatus === 'Recusado' || novoStatus === 'Cancelado') {
      motivo = window.prompt("Por favor, informe o motivo do cancelamento/recusa:");
      if (!motivo) return;
    }

    try {
      const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idSolicitacao}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo_recusa: motivo })
      });

      if (resposta.ok) {
        setSolicitacoes(prev => prev.map(sol => sol.id === idSolicitacao ? { ...sol, status: novoStatus } : sol));
        alert(`Status atualizado com sucesso!`);
      } else {
        alert("Erro ao atualizar o status no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Falha de conexão com o servidor.");
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));

  return (
    <div className="painel-geral-wrapper">

      <header className="painel-cabecalho">
        <h1>Painel Geral de Solicitações</h1>
        <p>Gerencie todas as solicitações — materiais, WBS, NFs, entradas, crossdocking e reintegrações</p>
      </header>

      {/* CARD KPIs SUPERIORES */}
      <div className="kpis-linha-5">
        <div className="kpi-card-resumo kpi-total">
          <span>Total Filtrado</span>
          <strong>{totalRegistros}</strong>
        </div>
        <div className="kpi-card-resumo kpi-pendentes">
          <span>Pendentes</span>
          <strong>{solicitacoes.filter(s => s.status === 'Pendente').length}</strong>
        </div>
        <div className="kpi-card-resumo kpi-andamento">
          <span>Em Andamento</span>
          <strong>{solicitacoes.filter(s => s.status === 'Em Separação').length}</strong>
        </div>
        <div className="kpi-card-resumo kpi-concluidos">
          <span>Concluídos</span>
          <strong>{solicitacoes.filter(s => s.status === 'Concluído').length}</strong>
        </div>
        <div className="kpi-card-resumo kpi-recusados">
          <span>Cancelados/Recusados</span>
          <strong>{solicitacoes.filter(s => s.status === 'Cancelado' || s.status === 'Recusado').length}</strong>
        </div>
      </div>

      {/* ÁREA DA TABELA */}
      <div className="tabela-cartao-container">

        <div className="tabela-controlos-topo">
          <div className="filtros-botoes">
            {filtrosArray.map((filtro) => (
              <button
                key={filtro}
                className={`btn-aba ${filtroAtivo === filtro ? 'ativo' : ''}`}
                onClick={() => lidarComMudancaFiltro(filtro)}
              >
                {filtro}
              </button>
            ))}
          </div>

          <div className="controlos-direita">
            <select className="select-periodo">
              <option>Todo Período</option>
              <option>Este Mês</option>
              <option>Hoje</option>
            </select>
            <div className="pesquisa-wrapper-direita">
              <Search className="icone-pesquisa-dir" size={16} />
              <input
                type="text"
                placeholder="Buscar solicitações..."
                value={termoPesquisa}
                onChange={lidarComMudancaPesquisa}
              />
            </div>
          </div>
        </div>

        <div className="tabela-scroll-horizontal">
          <table className="tabela-solicitacoes">
            <thead>
              <tr>
                <th className="col-chevron"></th>
                <th>TIPO</th>
                <th>ID / SOLICITANTE / WBS</th>
                <th>Nº DO BS</th>
                <th>DATA CRIAÇÃO</th>
                <th>DATA/HORA FINALIZ.</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                    Carregando dados do servidor...
                  </td>
                </tr>
              ) : solicitacoes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhuma solicitação encontrada para esta página.
                  </td>
                </tr>
              ) : (
                solicitacoes.map((linha) => {
                  const isCrossdocking = linha.tipo === 'Crossdocking';
                  let nfNoEstoque = true;

                  if (isCrossdocking && linha.nfCrossdocking) {
                    nfNoEstoque = estoque.some(itemEstoque => {
                      const nfEstoqueLimpa = String(itemEstoque.nf_entrada || '').trim();
                      const nfSolicitacaoLimpa = String(linha.nfCrossdocking || '').trim();
                      return nfEstoqueLimpa === nfSolicitacaoLimpa && nfEstoqueLimpa !== '';
                    });
                  }

                  const statusBloqueado = isCrossdocking && !nfNoEstoque;

                  return (
                    <tr key={linha.id}>
                      <td className="col-chevron">
                        <ChevronRight size={18} />
                      </td>

                      <td>
                        <span className="badge-tipo">
                          <GitBranch size={14} /> {linha.tipo}
                        </span>
                      </td>

                      <td>
                        <div className="bloco-id-multiplo">
                          <span className="texto-ps-id">PS : {linha.idNumerico}</span>
                          <span className="nome-solicitante">{linha.solicitante}</span>
                          <a href="#" className="link-wbs">{linha.wbs}</a>
                        </div>
                      </td>

                      <td>
                        {linha.bs ? (
                          <span className="badge-bs">
                            <FileText size={14} /> {linha.bs}
                          </span>
                        ) : (
                          <span className="traco-vazio">—</span>
                        )}
                      </td>

                      <td className="texto-data">{linha.dataCriacaoFormatada}</td>

                      <td>
                        {linha.dataFinalizacao ? (
                          <div className="bloco-finalizacao">
                            <span className="texto-data-verde">{linha.dataFinalizacao}</span>
                            <button className="btn-editar-data"><Edit2 size={12} /> Editar</button>
                          </div>
                        ) : (
                          linha.status !== 'Cancelado' ? (
                            <div className="bloco-finalizacao">
                              <span className="texto-data-amarelo">não definido</span>
                              <button className="btn-editar-data"><Edit2 size={12} /> Editar</button>
                            </div>
                          ) : (
                            <span className="traco-vazio">—</span>
                          )
                        )}
                      </td>

                      <td>{renderBadgeStatus(linha.status)}</td>

                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {linha.status === 'Pendente' ? (
                          statusBloqueado ? (
                            <div
                              title={`Aguardando NF ${linha.nfCrossdocking || ''} dar entrada no estoque`}
                              style={{
                                color: '#d97706',
                                backgroundColor: '#fefce8',
                                border: '1px solid #fde047',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              <AlertCircle size={14} /> Aguardando NF
                            </div>
                          ) : (
                            <button
                              className="btn-aprovar-acao"
                              style={{
                                backgroundColor: '#ea580c',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '6px 16px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                lidarComMudancaStatus(linha.idOriginal || linha.id, 'Em Separação');
                              }}
                            >
                              <RefreshCw size={14} /> Aprovar
                            </button>
                          )
                        ) : (
                          <select
                            className="select-acao"
                            value={linha.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              lidarComMudancaStatus(linha.idOriginal || linha.id, e.target.value);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '20px',
                              backgroundColor: '#f8fafc',
                              fontSize: '0.875rem',
                              color: '#334155',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="Pendente" disabled>Pendente</option>
                            <option value="Em Separação">Em Separação</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="Recusado">Recusado</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 📄 CONTROLE DE PAGINAÇÃO COM BOTÕES NUMÉRICOS CLICÁVEIS */}
          <div className="paginacao-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
            <div className="paginacao-info" style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> &middot; Exibindo {solicitacoes.length} de <strong>{totalRegistros}</strong> resultados
            </div>
            
            <div className="paginacao-botoes" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Botão Anterior */}
              <button 
                className="btn-paginacao" 
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))} 
                disabled={paginaAtual === 1 || carregando}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#334155', cursor: (paginaAtual === 1 || carregando) ? 'not-allowed' : 'pointer', opacity: (paginaAtual === 1 || carregando) ? 0.6 : 1 }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              {/* ✨ GERADOR DINÂMICO DOS NÚMEROS DAS PÁGINAS (1, 2, 3...) */}
              {Array.from({ length: totalPaginas }, (_, index) => {
                const numeroPagina = index + 1;
                const ehAtiva = paginaAtual === numeroPagina;
                
                return (
                  <button
                    key={numeroPagina}
                    onClick={() => setPaginaAtual(numeroPagina)}
                    disabled={carregando}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: ehAtiva ? '#ea580c' : '#ffffff', 
                      color: ehAtiva ? '#ffffff' : '#334155',
                      border: `1px solid ${ehAtiva ? '#ea580c' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: ehAtiva ? '600' : '500',
                      cursor: carregando ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {numeroPagina}
                  </button>
                );
              })}

              {/* Botão Próxima */}
              <button 
                className="btn-paginacao" 
                onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))} 
                disabled={paginaAtual === totalPaginas || carregando || totalRegistros === 0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#334155', cursor: (paginaAtual === totalPaginas || carregando || totalRegistros === 0) ? 'not-allowed' : 'pointer', opacity: (paginaAtual === totalPaginas || carregando || totalRegistros === 0) ? 0.6 : 1 }}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}