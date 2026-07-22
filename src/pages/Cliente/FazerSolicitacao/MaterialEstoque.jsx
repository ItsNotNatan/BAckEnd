import React, { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Calendar,
  Package,
  Send,
  Trash2,
  Zap
} from "lucide-react";

// NOSSOS COMPONENTES E HOOKS
import ModalProcessamento from "../../../components/ModalProcessamento/ModalProcessamento";
import { useProcessadorExcel } from "../../../hooks/useProcessadorExcel";
import ExemploExcel from "../../../components/ExemploExcel/ExemploExcel";
import GerenciadorAnexos from "../../../components/GerenciadorAnexos/GerenciadorAnexos";
import SeletorEstoqueLateral from "../../../components/SeletorEstoqueLateral/SeletorEstoqueLateral"; // 👈 NOVO COMPONENTE
import { supabase } from "../../../supabaseClient";

export default function MaterialEstoque() {
  const [formDados, setFormDados] = useState({
    nome: "",
    wbs: "",
    destino: "",
    dataNecessidade: "",
    observacoes: "",
    entregaUrgente: false,
  });

  // ✨ ESTADO E EFFECT: Lógica exata do RequestForm para travar o calendário
  const [dataMinima, setDataMinima] = useState("");

  useEffect(() => {
    const hoje = new Date();
    const timezoneOffset = hoje.getTimezoneOffset() * 60000;
    const localISOTime = new Date(hoje.getTime() - timezoneOffset).toISOString().split("T")[0];
    setDataMinima(localISOTime);
  }, []);

  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [anexos, setAnexos] = useState([]);

  const [estoqueDisponivel, setEstoqueDisponivel] = useState([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);

  const processador = useProcessadorExcel();

  // =========================================================
  // MÁGICA: BUSCAR ESTOQUE REAL DA API PARA A LISTA LATERAL
  // =========================================================
  useEffect(() => {
    const buscarEstoqueReal = async () => {
      try {
        const resposta = await fetch("http://localhost:3001/api/estoque/listar");
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          
          const itensComSaldo = resultado.dados
            .filter((item) => item.quantidade_disponivel > 0)
            .map((item) => ({
              idBD: item.id,
              desenhoSAP: item.desenho_sap_manual || item.desenho_sap || "-",
              materialDescription: item.descricao_manual || item.descricao || "-",
              numPecaFabricante: item.part_number_manual || item.part_number || "-",
              fornecedor: item.fornecedor || "-",
              qtdFornecida: item.quantidade_disponivel || 0,
              nf: item.nf_entrada || "-",
              referencia: "-",
              unidadeMedida: item.unidade_medida_manual || item.unidade_medida || "Unid",
              vendorDescription: item.descricao_manual || item.descricao || "-",
              wbs: item.wbs_element || item.wbs || "-",
              alocacao: item.alocacao || "-",
              isTransferencia: item.is_transferencia || false 
            }));

          setEstoqueDisponivel(itensComSaldo);
        } else {
          console.error("Erro retornado do servidor:", resultado.erro);
        }
      } catch (error) {
        console.error("Falha ao buscar dados do estoque:", error);
      } finally {
        setCarregandoEstoque(false);
      }
    };

    buscarEstoqueReal();
  }, []);

  const handleImportarExcel = async (arquivo) => {
    const novosItens = await processador.iniciarProcessamento(arquivo);
    if (novosItens && Array.isArray(novosItens)) {
      setItensSelecionados((prev) => [...prev, ...novosItens]);
    }
  };

  const removerItem = (idParaRemover) => {
    setItensSelecionados((prev) => prev.filter((item) => item.id !== idParaRemover));
  };

  const atualizarCampo = (id, campo, novoValor) => {
    setItensSelecionados((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: novoValor } : item))
    );
  };

  const adicionarManualmente = (item, index) => {
    setItensSelecionados((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${index}`, 
        estoque_id: item.idBD || null,
        ...item,
        qtdSelecionada: 1,
      },
    ]);
  };

  const handleEnviar = async () => {
    if (!formDados.nome || !formDados.wbs || !formDados.destino || !formDados.dataNecessidade) {
      alert("Por favor, preencha todos os campos obrigatórios do solicitante (*).");
      return;
    }

    if (formDados.dataNecessidade && formDados.dataNecessidade < dataMinima) {
      alert("A Data de Necessidade não pode ser anterior ao dia de hoje. Por favor, corrija no calendário.");
      return;
    }

    if (itensSelecionados.length === 0) {
      alert("Adicione pelo menos um item à solicitação.");
      return;
    }

    const itensIncompletos = itensSelecionados.some(
      (i) => !i.numPecaFabricante || !i.materialDescription || !i.qtdSelecionada
    );
    
    if (itensIncompletos) {
      alert("Preencha os campos obrigatórios (Part Number, Descrição e Qtd) em todas as linhas da tabela.");
      return;
    }

    const anexosProcessados = [];
    if (anexos.length > 0) {
      for (const arquivo of anexos) {
        const extensao = arquivo.name.split(".").pop();
        const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
        const caminhoNoStorage = `uploads/${nomeUnico}`;

        const { error: erroUpload } = await supabase.storage.from("documentos").upload(caminhoNoStorage, arquivo);

        if (erroUpload) {
          console.error("Erro ao subir arquivo:", erroUpload);
          alert(`Falha ao anexar o ficheiro: ${arquivo.name}`);
          return;
        }

        const { data: linkPublico } = supabase.storage.from("documentos").getPublicUrl(caminhoNoStorage);

        anexosProcessados.push({
          nome_arquivo: arquivo.name,
          url_arquivo: linkPublico.publicUrl,
        });
      }
    }

    const payload = {
      solicitante: formDados,
      itens: itensSelecionados,
      anexos: anexosProcessados,
    };

    try {
      const resposta = await fetch("http://localhost:3001/api/solicitacoes/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação criada com o ID: ${dados.ps_id}`);
        setFormDados({
          nome: "",
          wbs: "",
          destino: "",
          dataNecessidade: "",
          observacoes: "",
          entregaUrgente: false,
        });
        setItensSelecionados([]);
        setAnexos([]);
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor.");
    }
  };

  const listaSegura = Array.isArray(itensSelecionados) ? itensSelecionados : [];

  return (
    <>
      <ModalProcessamento
        estaProcessando={processador.estaProcessando}
        concluido={processador.concluido}
        estadoProgresso={processador.estadoProgresso}
        resultado={processador.resultado}
        erroFatal={processador.erroFatal}
        onClose={processador.resetarProcessador}
      />

      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone">
              <User size={18} />
            </div>
            <h2>Dados do Solicitante</h2>
          </div>
        </div>

        <div className="form-grid">
          <div className="input-grupo">
            <label>NOME DO SOLICITANTE *</label>
            <input
              type="text"
              className="input-campo"
              placeholder="Seu nome completo"
              value={formDados.nome}
              onChange={(e) =>
                setFormDados({ ...formDados, nome: e.target.value })
              }
            />
          </div>
          <div className="input-grupo">
            <label>WBS / CENTRO DE CUSTO *</label>
            <input
              type="text"
              className="input-campo"
              placeholder="Ex: WBS-PRJ-2024-001"
              value={formDados.wbs}
              onChange={(e) =>
                setFormDados({ ...formDados, wbs: e.target.value })
              }
            />
          </div>
          <div className="input-grupo">
            <label>
              <MapPin size={14} /> FILIAL DE ORIGEM
            </label>
            <div className="input-wrapper-fixo">
              <MapPin size={16} className="icone-dentro-input" />
              <input
                type="text"
                className="input-campo"
                value="BR04 — Goiana, PE"
                readOnly
              />
              <span className="badge-fixo">Fixo</span>
            </div>
          </div>
          <div className="input-grupo row-span-2">
            <label>
              <MapPin size={14} /> DESTINO *
            </label>
            <textarea
              className="input-campo"
              placeholder="Local de destino do material"
              value={formDados.destino}
              onChange={(e) =>
                setFormDados({ ...formDados, destino: e.target.value })
              }
            ></textarea>
          </div>
          <div className="input-grupo">
            <label>
              <Calendar size={14} /> DATA DE NECESSIDADE *
            </label>
            <input
              type="date"
              className="input-campo"
              value={formDados.dataNecessidade}
              min={dataMinima}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              style={{ cursor: "pointer", width: "100%", boxSizing: "border-box" }}
              onChange={(e) =>
                setFormDados({ ...formDados, dataNecessidade: e.target.value })
              }
            />
          </div>
          <div className="input-grupo span-2">
            <label>OBSERVAÇÕES</label>
            <textarea
              className="input-campo"
              placeholder="Informações adicionais..."
              rows="2"
              value={formDados.observacoes}
              onChange={(e) =>
                setFormDados({ ...formDados, observacoes: e.target.value })
              }
            ></textarea>
          </div>
        </div>

        <GerenciadorAnexos anexos={anexos} setAnexos={setAnexos} />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "16px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
            marginTop: "20px",
          }}
        >
          <input
            type="checkbox"
            id="checkbox-urgente"
            checked={formDados.entregaUrgente}
            onChange={(e) =>
              setFormDados({ ...formDados, entregaUrgente: e.target.checked })
            }
            style={{
              marginTop: "4px",
              cursor: "pointer",
              width: "16px",
              height: "16px",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={16} color="#475569" />
              <label
                htmlFor="checkbox-urgente"
                style={{
                  fontWeight: "600",
                  color: "#0f172a",
                  margin: 0,
                  cursor: "pointer",
                }}
              >
                Entrega Urgente
              </label>
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                marginTop: "4px",
              }}
            >
              Marcando esta opção, a solicitação entrará em fila de aprovação
              exclusiva do Administrador.
            </span>
          </div>
        </div>
      </div>

      <div className="selecao-itens-grid">
        
        {/* 👇 O NOVO COMPONENTE ISOLADO FAZ TUDO AQUI! 👇 */}
        <SeletorEstoqueLateral 
          estoque={estoqueDisponivel}
          carregando={carregandoEstoque}
          onAdicionarItem={adicionarManualmente}
        />

        <div
          className="painel-lista"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            className="painel-lista-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
                color: "#1e293b",
              }}
            >
              <Package size={18} color="#2563eb" /> Itens Selecionados
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ExemploExcel />
              <span className="badge-contador-simples">
                {listaSegura.length} itens
              </span>
            </div>
          </div>

          {listaSegura.length === 0 ? (
            <div
              className="estado-vazio-selecao"
              style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}
            >
              <Package
                size={48}
                strokeWidth={1}
                style={{
                  opacity: 0.3,
                  margin: "0 auto 16px auto",
                  display: "block",
                }}
              />
              <p>
                Clique nos itens à esquerda, adicione uma linha manual ou
                importe um Excel do SAP
              </p>
            </div>
          ) : (
            <div
              className="scroll-tabela-solicitacao"
              style={{ overflowX: "auto" }}
            >
              <table
                className="tabela-solicitacao-dados"
                style={{
                  width: "100%",
                  minWidth: "1300px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        width: "50px",
                      }}
                    ></th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      MATERIAL DESCRIPTION
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Nº PEÇA FABRICANTE
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      QTD. SOLICITADA
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      DESENHO SAP
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      FORNECEDOR
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      REFERÊNCIA
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      UNIDADE
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      WBS
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      ALOCAÇÃO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listaSegura.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ textAlign: "center", padding: "12px" }}>
                        <button
                          onClick={() => removerItem(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <td style={{ minWidth: "220px", padding: "8px 12px" }}>
                        <input
                          value={item.materialDescription || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "materialDescription",
                              e.target.value,
                            )
                          }
                          placeholder="Descrição do item"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            color: "#334155",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.numPecaFabricante || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "numPecaFabricante",
                              e.target.value,
                            )
                          }
                          placeholder="PN"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            fontWeight: "600",
                            color: "#1e293b",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          type="number"
                          value={item.qtdSelecionada || 1}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "qtdSelecionada",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "70px",
                            border: "1px solid #a7f3d0",
                            backgroundColor: "#ecfdf5",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            outline: "none",
                            color: "#10b981",
                            fontWeight: "700",
                            textAlign: "center",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.desenhoSAP || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "desenhoSAP",
                              e.target.value,
                            )
                          }
                          placeholder="SAP"
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: "1px solid #bfdbfe",
                            fontWeight: "600",
                            fontFamily: "monospace",
                            width: "100%",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.fornecedor || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "fornecedor",
                              e.target.value,
                            )
                          }
                          placeholder="Fornecedor"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            color: "#475569",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.referencia || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "referencia",
                              e.target.value,
                            )
                          }
                          placeholder="Ref"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            color: "#64748b",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.unidadeMedida || ""}
                          onChange={(e) =>
                            atualizarCampo(
                              item.id,
                              "unidadeMedida",
                              e.target.value,
                            )
                          }
                          placeholder="Unid"
                          style={{
                            width: "60px",
                            border: "none",
                            outline: "none",
                            color: "#475569",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input
                          value={item.wbs || ""}
                          onChange={(e) =>
                            atualizarCampo(item.id, "wbs", e.target.value)
                          }
                          placeholder="WBS"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            color: "#475569",
                            backgroundColor: "transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {/* 👇 MOSTRAMOS SE É TRANSFERIDO NA COLUNA ALOCAÇÃO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            value={item.alocacao || ""}
                            onChange={(e) =>
                              atualizarCampo(item.id, "alocacao", e.target.value)
                            }
                            placeholder="Alocação"
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              color: "#2563eb",
                              fontFamily: "monospace",
                              fontWeight: "600",
                              backgroundColor: "transparent",
                            }}
                          />
                          {item.isTransferencia && (
                            <span style={{ fontSize: '0.65rem', color: '#ca8a04', fontWeight: 'bold' }}>
                              *Transferido
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="form-acoes-final mt-4">
        <button className="btn-enviar-azul" onClick={handleEnviar}>
          <Send size={16} /> Enviar Solicitação
        </button>
      </div>
    </>
  );
}