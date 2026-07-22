import React, { useState, useEffect } from "react";
import "./AcompanhamentoSolicitacoes.css";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  GitBranch,
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  Upload,
  AlertCircle
} from "lucide-react";

import DetalhesSolicitacao from "./Detalhes/DetalhesSolicitacao";
import GerenciadorAnexos from "../../../components/GerenciadorAnexos/GerenciadorAnexos";
import { supabase } from "../../../supabaseClient";

// --- FUNÇÕES AUXILIARES DE RENDERIZAÇÃO ---
const renderBadgeStatus = (status) => {
  switch (status) {
    case "Pendente":
    case "Em Separação":
    case "Em Andamento":
      return (
        <span className="badge-status status-separacao">
          <RefreshCw size={14} className="animate-spin" /> {status}
        </span>
      );
    case "Concluído":
      return (
        <span className="badge-status status-concluido">
          <CheckCircle2 size={14} /> Concluído
        </span>
      );
    case "Cancelado":
    case "Recusado":
      return (
        <span className="badge-status status-cancelado">
          <XCircle size={14} /> {status}
        </span>
      );
    default:
      return <span className="badge-status">{status}</span>;
  }
};

const obterClasseBadgeTipo = (tipo) => {
  switch (tipo) {
    case "Transfer. WBS":
    case "Transferencia WBS":
      return "badge-tipo-amarelo";
    case "Nota Fiscal":
      return "badge-tipo-roxo";
    case "Entrada":
      return "badge-tipo-verde";
    case "Crossdocking":
      return "badge-tipo-ciano";
    case "Reintegração":
    case "Reintegracao":
      return "badge-tipo-laranja";
    case "Cancelado":
      return "badge-tipo-vermelho";
    case "Material":
    default:
      return "badge-tipo-azul";
  }
};

// --- COMPONENTE PRINCIPAL ---
export default function AcompanhamentoSolicitacoes({ perfil = "cliente" }) {
  const [dadosTabela, setDadosTabela] = useState([]);
  const [estoque, setEstoque] = useState([]); 
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [linhaExpandida, setLinhaExpandida] = useState(null);
  const [anexosNovos, setAnexosNovos] = useState([]);

  // 📄 CONTROLE DE PAGINAÇÃO REAL (No Banco de Dados)
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0); // 👈 Precisamos saber o total real do BD
  const itensPorPagina = 10;

  const listaFiltros = [
    "Todos",
    "Material",
    "Transfer. WBS",
    "Nota Fiscal",
    "Entrada",
    "Crossdocking",
    "Reintegração",
  ];

  // BUSCA DADOS DINÂMICOS NA API SEMPRE QUE A PÁGINA OU FILTROS MUDAREM
  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregando(true);
        
        // Mapeia o filtro de tipo para o nome correto que o banco espera
        const tipoMapeado = filtroAtivo === "Transfer. WBS" ? "Transferencia WBS" : filtroAtivo === "Reintegração" ? "Reintegracao" : filtroAtivo;
        
        // 🚀 URL ATUALIZADA: Agora envia os parâmetros para o back-end carregar "de pouco em pouco"
        const urlSolicitacoes = `http://localhost:3001/api/solicitacoes/listar?page=${paginaAtual}&limit=${itensPorPagina}&busca=${termoPesquisa}&tipo=${tipoMapeado !== 'Todos' ? tipoMapeado : ''}&status=${filtroStatus !== 'Todos' ? filtroStatus : ''}`;

        const [resSolicitacoes, resEstoque] = await Promise.all([
          fetch(urlSolicitacoes),
          fetch("http://localhost:3001/api/estoque/listar")
        ]);

        const resultadoSol = await resSolicitacoes.json();
        const resultadoEst = await resEstoque.json();

        if (resEstoque.ok && resultadoEst.sucesso) {
          setEstoque(resultadoEst.dados);
        }

        if (resSolicitacoes.ok && resultadoSol.sucesso) {
          const dadosFormatados = resultadoSol.dados.map((item) => {
            let prefixo = "PS";
            if (item.tipo === "Crossdocking") prefixo = "CD";
            else if (item.tipo === "Nota Fiscal") prefixo = "NF";
            else if (item.tipo === "Transferencia WBS") prefixo = "TR";
            else if (item.tipo === "Reintegracao") prefixo = "REI";
            else if (item.tipo === "Entrada") prefixo = "EN";

            const idNumerico = item.id.replace(/\D/g, "");

            let acaoTipo = "select";
            let acaoValor = item.status;

            if (item.status === "Pendente") {
              acaoTipo = "botao";
              acaoValor = "Aprovar";
            } else if (item.status === "Em Separação" || item.status === "Em Andamento") {
              acaoValor = "Em Separação";
            }

            return {
              ...item,
              idOriginal: item.id,
              id: idNumerico || item.id,
              prefixo: prefixo,
              acaoTipo: acaoTipo,
              acaoValor: acaoValor,
              dataSolicitacao: item.dataSolicitacao || "-",
              dataEntrega: item.dataEntrega || "-",
              bs: item.bs || "-",
              nfCrossdocking: item.nfCrossdocking || null 
            };
          });

          setDadosTabela(dadosFormatados);
          // 👈 O back-end precisa retornar a chave "total" (COUNT) para sabermos que existem 12 itens
          setTotalRegistros(resultadoSol.total || resultadoSol.dados.length); 
        } else {
          console.error("Erro retornado do servidor:", resultadoSol.erro);
        }
      } catch (error) {
        console.error("Falha ao conectar à API:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, [paginaAtual, filtroAtivo, filtroStatus, termoPesquisa]); // 👈 O React refaz a busca se essas variáveis mudarem

  // Se digitar na pesquisa ou clicar num filtro, reseta para a página 1
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroAtivo, filtroStatus, termoPesquisa]);

  // Ações de alteração de status
  const lidarComMudancaStatus = async (idSolicitacao, novoStatus) => {
    if (!window.confirm(`Tem certeza que deseja mudar o status para "${novoStatus}"?`)) return;

    let motivo = null;
    if (novoStatus === 'Recusado' || novoStatus === 'Cancelado') {
      motivo = window.prompt("Por favor, informe o motivo:");
      if (!motivo) return; 
    }

    try {
      const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idSolicitacao}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo_recusa: motivo })
      });

      if (resposta.ok) {
        setDadosTabela(prev => prev.map(sol => {
          if (sol.idOriginal === idSolicitacao) {
            return { 
              ...sol, 
              status: novoStatus, 
              acaoValor: novoStatus, 
              acaoTipo: novoStatus === 'Pendente' ? 'botao' : 'select' 
            };
          }
          return sol;
        }));
        alert(`Status atualizado para ${novoStatus} com sucesso!`);
      } else {
        alert("Erro ao atualizar o status no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Falha de conexão com o servidor.");
    }
  };

  // KPIs (Atenção: Atualmente eles calculam com base apenas na página de 10 itens exibida)
  const kpiTotal = dadosTabela.length;
  const kpiPendentes = dadosTabela.filter((item) => item.status === "Pendente").length;
  const kpiAndamento = dadosTabela.filter((item) => item.status === "Em Separação" || item.status === "Em Andamento").length;
  const kpiConcluidos = dadosTabela.filter((item) => item.status === "Concluído").length;
  const kpiRecusados = dadosTabela.filter((item) => item.status === "Recusado" || item.status === "Cancelado").length;

  // Total de Páginas calculado com base no total REAL do banco de dados (os 12 que você tem)
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / itensPorPagina));
  const indexPrimeiroItem = (paginaAtual - 1) * itensPorPagina;
  const indexUltimoItem = paginaAtual * itensPorPagina;

  const toggleLinha = (idUnico) => {
    setLinhaExpandida(linhaExpandida === idUnico ? null : idUnico);
    setAnexosNovos([]);
  };

  const handleDeletarAnexo = async (idSolicitacao, anexo) => {
    if (!window.confirm(`Tem a certeza que deseja apagar permanentemente o ficheiro "${anexo.nome_arquivo}"?`)) return;

    try {
      const resposta = await fetch(`http://localhost:3001/api/solicitacoes/anexo/${anexo.id}`, { method: "DELETE" });
      if (resposta.ok) {
        setDadosTabela((prev) =>
          prev.map((sol) => {
            if (sol.idOriginal === idSolicitacao) {
              return { ...sol, anexos: sol.anexos.filter((a) => a.id !== anexo.id) };
            }
            return sol;
          })
        );
      } else {
        alert("Erro ao apagar o anexo.");
      }
    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      alert("Falha ao comunicar com o servidor.");
    }
  };

  const handleEnviarAnexosExtras = async (idSolicitacao) => {
    if (anexosNovos.length === 0) return;

    try {
      setCarregando(true);
      const anexosProcessados = [];

      for (const arquivo of anexosNovos) {
        const extensao = arquivo.name.split(".").pop();
        const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
        const caminhoNoStorage = `uploads/${nomeUnico}`;

        const { error: erroUpload } = await supabase.storage.from("documentos").upload(caminhoNoStorage, arquivo);

        if (erroUpload) {
          console.error("Erro ao subir arquivo para o Storage:", erroUpload);
          alert(`Falha ao anexar o ficheiro: ${arquivo.name}`);
          setCarregando(false);
          return;
        }

        const { data: linkPublico } = supabase.storage.from("documentos").getPublicUrl(caminhoNoStorage);

        anexosProcessados.push({
          nome_arquivo: arquivo.name,
          url_arquivo: linkPublico.publicUrl,
        });
      }

      const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idSolicitacao}/anexos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anexos: anexosProcessados }),
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        alert("Sucesso! Novos anexos integrados na base de dados.");
        setAnexosNovos([]);
        setLinhaExpandida(null);
        window.location.reload(); 
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição de anexos extras:", error);
      alert("Falha ao conectar com o servidor para salvar os anexos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="acompanhamento-wrapper">
      <header className="acompanhamento-cabecalho">
        <h1>{perfil === "logistica" ? "Painel Geral de Solicitações" : "Acompanhamento de Solicitações"}</h1>
        <p>
          {perfil === "logistica" 
            ? "Gerencie todas as solicitações — materiais, WBS, NFs, entradas, crossdocking e reintegrações" 
            : "Visualize todas as solicitações abertas do sistema"}
        </p>
      </header>

      <div className="kpis-linha">
        <div className={`kpi-card-resumo kpi-total ${filtroStatus === "Todos" ? "ativo" : ""}`} onClick={() => setFiltroStatus("Todos")}>
          <span>Total</span><strong>{kpiTotal}</strong>
        </div>
        <div className={`kpi-card-resumo kpi-pendentes ${filtroStatus === "Pendente" ? "ativo" : ""}`} onClick={() => setFiltroStatus("Pendente")}>
          <span>Pendentes</span><strong>{kpiPendentes}</strong>
        </div>
        <div className={`kpi-card-resumo kpi-andamento ${filtroStatus === "Em Separação" ? "ativo" : ""}`} onClick={() => setFiltroStatus("Em Separação")}>
          <span>Em Andamento</span><strong>{kpiAndamento}</strong>
        </div>
        <div className={`kpi-card-resumo kpi-concluidos ${filtroStatus === "Concluído" ? "ativo" : ""}`} onClick={() => setFiltroStatus("Concluído")}>
          <span>Concluídos</span><strong>{kpiConcluidos}</strong>
        </div>
        <div className={`kpi-card-resumo kpi-recusados ${filtroStatus === "Recusado" ? "ativo" : ""}`} onClick={() => setFiltroStatus("Recusado")}>
          <span>Recusados</span><strong>{kpiRecusados}</strong>
        </div>
      </div>

      <div className="tabela-cartao-container">
        <div className="tabela-controlos-topo">
          <div className="filtros-botoes">
            {listaFiltros.map((filtro) => (
              <button
                key={filtro}
                className={`btn-aba ${filtroAtivo === filtro ? "ativo" : ""}`}
                onClick={() => setFiltroAtivo(filtro)}
              >
                {filtro}
              </button>
            ))}
          </div>
          <div className="pesquisa-wrapper-direita">
            <Search className="icone-pesquisa-dir" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID, solicitante, WBS..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
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
                <th>DATA ENTREGA</th>
                <th>STATUS</th>
                {perfil === "logistica" && <th>AÇÕES</th>}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={perfil === "logistica" ? 8 : 7} style={{ padding: "60px", textAlign: "center", color: "#64748b", fontWeight: "500" }}>
                    Carregando solicitações...
                  </td>
                </tr>
              ) : dadosTabela.length === 0 ? (
                <tr>
                  <td colSpan={perfil === "logistica" ? 8 : 7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                dadosTabela.map((linha, index) => {
                  const idUnico = `${linha.prefixo}-${linha.id}-${index}`;
                  const isExpandida = linhaExpandida === idUnico;

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
                    <React.Fragment key={idUnico}>
                      <tr className={isExpandida ? "tr-expandida" : ""}>
                        <td className="col-chevron" onClick={() => toggleLinha(idUnico)}>
                          <ChevronRight
                            size={18}
                            className={isExpandida ? "icone-rotacionado" : "icone-normal"}
                            style={{ color: "#94a3b8" }}
                          />
                        </td>

                        <td>
                          <div className="bloco-tipo-id">
                            <span className={`badge-tipo ${obterClasseBadgeTipo(linha.tipo)} ${linha.entregaUrgente ? "badge-urgente-critico" : ""}`}>
                              {linha.entregaUrgente ? (
                                <Zap size={13} color="#ef4444" fill="#ef4444" />
                              ) : (
                                <GitBranch size={13} />
                              )}
                              {linha.tipo}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#1e293b" }}>
                              {linha.prefixo || "PS"}:{linha.id}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>
                              {linha.solicitante}
                            </span>
                            {linha.wbs && (
                              <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "500" }}>
                                {linha.wbs}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          {linha.bs && linha.bs !== "-" && linha.bs !== "—" ? (
                            <span className="badge-bs">
                              <FileText size={14} /> {linha.bs}
                            </span>
                          ) : (
                            <span className="traco-vazio">—</span>
                          )}
                        </td>
                        <td className="texto-data">{linha.dataSolicitacao}</td>
                        <td>
                          {linha.dataEntrega && linha.dataEntrega !== "-" && linha.dataEntrega !== "—" ? (
                            <span className="texto-data-verde">{linha.dataEntrega}</span>
                          ) : (
                            <span className="traco-vazio">—</span>
                          )}
                        </td>
                        <td>{renderBadgeStatus(linha.status)}</td>

                        {perfil === "logistica" && (
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {linha.status === 'Pendente' ? (
                              statusBloqueado ? (
                                <div 
                                  title={`Aguardando NF ${linha.nfCrossdocking || ''} dar entrada no estoque`} 
                                  style={{ color: '#d97706', backgroundColor: '#fefce8', border: '1px solid #fde047', padding: '6px 12px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '600' }}
                                >
                                  <AlertCircle size={14} /> Aguardando NF
                                </div>
                              ) : (
                                <button 
                                  className="btn-aprovar-acao" 
                                  style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
                                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '20px', backgroundColor: '#f8fafc', fontSize: '0.875rem', color: '#334155', outline: 'none', cursor: 'pointer' }}
                              >
                                <option value="Pendente" disabled>Pendente</option>
                                <option value="Em Separação">Em Separação</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Cancelado">Cancelado</option>
                                <option value="Recusado">Recusado</option>
                              </select>
                            )}
                          </td>
                        )}
                      </tr>

                      {isExpandida && (
                        <tr>
                          <td colSpan={perfil === "logistica" ? 8 : 7} className="td-expandida">
                            <DetalhesSolicitacao
                              item={linha}
                              perfil={perfil}
                              onDeleteAnexo={(anexo) => handleDeletarAnexo(linha.idOriginal, anexo)}
                            />
                            {perfil === "logistica" && (
                              <div style={{ padding: "0 32px 24px 32px", backgroundColor: "#f8fafc" }}>
                                <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: "0 0 16px 0" }} />
                                <GerenciadorAnexos
                                  anexos={anexosNovos}
                                  setAnexos={setAnexosNovos}
                                  titulo="ADICIONAR NOVOS ANEXOS A ESTA SOLICITAÇÃO"
                                />
                                {anexosNovos.length > 0 && (
                                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                                    <button
                                      onClick={() => handleEnviarAnexosExtras(linha.idOriginal)}
                                      disabled={carregando}
                                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: carregando ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: carregando ? "not-allowed" : "pointer" }}
                                    >
                                      <Upload size={16} />
                                      {carregando ? "A salvar..." : "Salvar Novos Anexos"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 📄 BARRA DE PAGINAÇÃO VINCULADA AO BACK-END */}
          <div className="paginacao-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
            <div className="paginacao-info" style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong> &middot; Exibindo {dadosTabela.length === 0 ? 0 : indexPrimeiroItem + 1} a <strong>{Math.min(indexUltimoItem, totalRegistros)}</strong> de <strong>{totalRegistros}</strong> resultados
            </div>
            
            <div className="paginacao-botoes" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button 
                className="btn-paginacao" 
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))} 
                disabled={paginaAtual === 1 || carregando}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#334155', cursor: (paginaAtual === 1 || carregando) ? 'not-allowed' : 'pointer', opacity: (paginaAtual === 1 || carregando) ? 0.6 : 1 }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

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

              <button 
                className="btn-paginacao" 
                onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))} 
                disabled={paginaAtual === totalPaginas || carregando || dadosTabela.length === 0}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#334155', cursor: (paginaAtual === totalPaginas || carregando || dadosTabela.length === 0) ? 'not-allowed' : 'pointer', opacity: (paginaAtual === totalPaginas || carregando || dadosTabela.length === 0) ? 0.6 : 1 }}
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