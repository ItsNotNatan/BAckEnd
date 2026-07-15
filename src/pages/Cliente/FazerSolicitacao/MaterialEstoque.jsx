import React, { useState } from 'react';
import { User, MapPin, Calendar, Search, Package, Send, FileSpreadsheet, Trash2, Plus, Zap } from 'lucide-react';

// NOSSOS COMPONENTES E HOOKS
import ModalProcessamento from '../../../components/ModalProcessamento/ModalProcessamento';
import { useProcessadorExcel } from '../../../hooks/useProcessadorExcel';
import ExemploExcel from '../../../components/ExemploExcel/ExemploExcel';

// DADOS MOCK (Estoque da esquerda)
const estoqueDisponivel = [
  { desenhoSAP: 'TEXXX-0000022629', materialDescription: 'REPARTIDORES LÓGICOS 4 X M12 FÊMEA', numPecaFabricante: 'PROLOGANT4RP', fornecedor: 'SENSTRONIC', qtdFornecida: '199', referencia: '9095', unidadeMedida: 'NR', vendorDescription: 'SENSTRONIC DO BRASIL', wbs: 'BRBCBBB29-...', emissaoNF: '23/06/2026', recebNF: '30/06/2026', docCompras: '34026', poNetPrice: 'R$ 1.697,39', centro: 'BR06', deposito: '0020', alocacao: '002-B-004' },
  { desenhoSAP: 'TAL-S378006', materialDescription: 'CONECTOR IE FC 180 4X2', numPecaFabricante: '6GK1901-1BB11-2AA0', fornecedor: 'SIEMENS', qtdFornecida: '4', referencia: 'AR-366866', unidadeMedida: 'NR', vendorDescription: 'SIEMENS INFRAESTRUTURA', wbs: 'BRBRRCY21-...', emissaoNF: '23/06/2026', recebNF: '30/06/2026', docCompras: '34246', poNetPrice: 'R$ 161,77', centro: 'BR06', deposito: '0020', alocacao: '002-B-004' },
];

export default function MaterialEstoque() {
  // 1. ESTADOS DO FORMULÁRIO
  const [formDados, setFormDados] = useState({
    nome: '',
    wbs: '',
    destino: '',
    dataNecessidade: '',
    observacoes: '',
    entregaUrgente: false 
  });
  const [itensSelecionados, setItensSelecionados] = useState([]);
  
  // INICIA O MAESTRO (Hook de Processamento do Excel)
  const processador = useProcessadorExcel();

  // 2. FUNÇÕES DE MANIPULAÇÃO DA TABELA E IMPORTAÇÃO
  const handleImportarExcel = async (arquivo) => {
    const novosItens = await processador.iniciarProcessamento(arquivo);
    if (novosItens && Array.isArray(novosItens)) {
      setItensSelecionados(prev => [...prev, ...novosItens]);
    }
  };

  const removerItem = (idParaRemover) => {
    setItensSelecionados(prev => prev.filter(item => item.id !== idParaRemover));
  };

  const atualizarCampo = (id, campo, novoValor) => {
    setItensSelecionados(prev => 
      prev.map(item => item.id === id ? { ...item, [campo]: novoValor } : item)
    );
  };

  const adicionarManualmente = (item, index) => {
    setItensSelecionados(prev => [...prev, {
      id: `manual-${Date.now()}-${index}`,
      ...item,
      qtdSelecionada: 1 
    }]);
  };

  const adicionarLinhaEmBranco = () => {
    setItensSelecionados(prev => [
      ...prev,
      {
        id: `linha-vazia-${Date.now()}`,
        desenhoSAP: '',
        materialDescription: '',
        numPecaFabricante: '',
        fornecedor: '',
        qtdSelecionada: 1,
        referencia: '',
        unidadeMedida: 'Unid',
        wbs: '',
        alocacao: ''
      }
    ]);
  };

  // 3. FUNÇÃO DE ENVIO PARA O BACKEND (NODE.JS)
  const handleEnviar = async () => {
    // Validação
    if (!formDados.nome || !formDados.wbs || !formDados.destino || !formDados.dataNecessidade) {
      alert("Por favor, preencha todos os campos obrigatórios do solicitante (*).");
      return;
    }

    if (itensSelecionados.length === 0) {
      alert("Adicione pelo menos um item à solicitação.");
      return;
    }

    const itensIncompletos = itensSelecionados.some(i => !i.numPecaFabricante || !i.materialDescription || !i.qtdSelecionada);
    if (itensIncompletos) {
      alert("Preencha os campos obrigatórios (Part Number, Descrição e Qtd) em todas as linhas da tabela.");
      return;
    }

    // Prepara o pacote (payload)
    const payload = {
      solicitante: formDados,
      itens: itensSelecionados
    };

try {
      // 👇 Alterado para a rota modularizada
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação criada com o ID: ${dados.ps_id}`);
        // Limpa o formulário após o sucesso
        setFormDados({ nome: '', wbs: '', destino: '', dataNecessidade: '', observacoes: '', entregaUrgente: false });
        setItensSelecionados([]);
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor. Verifique se o backend (Node.js) está rodando na porta 3001.");
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
            <div className="form-header-icone"><User size={18} /></div>
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
              onChange={(e) => setFormDados({...formDados, nome: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label>WBS / CENTRO DE CUSTO *</label>
            <input 
              type="text" 
              className="input-campo" 
              placeholder="Ex: WBS-PRJ-2024-001"
              value={formDados.wbs}
              onChange={(e) => setFormDados({...formDados, wbs: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label><MapPin size={14} /> FILIAL DE ORIGEM</label>
            <div className="input-wrapper-fixo">
              <MapPin size={16} className="icone-dentro-input" />
              <input type="text" className="input-campo" value="BR04 — Goiana, PE" readOnly />
              <span className="badge-fixo">Fixo</span>
            </div>
          </div>
          <div className="input-grupo row-span-2">
            <label><MapPin size={14} /> DESTINO *</label>
            <textarea 
              className="input-campo" 
              placeholder="Local de destino do material"
              value={formDados.destino}
              onChange={(e) => setFormDados({...formDados, destino: e.target.value})}
            ></textarea>
          </div>
          <div className="input-grupo">
            <label><Calendar size={14} /> DATA DE NECESSIDADE *</label>
            <input 
              type="date" 
              className="input-campo"
              value={formDados.dataNecessidade}
              onChange={(e) => setFormDados({...formDados, dataNecessidade: e.target.value})}
            />
          </div>
          <div className="input-grupo span-2">
            <label>OBSERVAÇÕES</label>
            <textarea 
              className="input-campo" 
              placeholder="Informações adicionais..." 
              rows="2"
              value={formDados.observacoes}
              onChange={(e) => setFormDados({...formDados, observacoes: e.target.value})}
            ></textarea>
          </div>
        </div>

        {/* --- COMPONENTE: ENTREGA URGENTE --- */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          marginTop: '20px'
        }}>
          <input 
            type="checkbox" 
            id="checkbox-urgente"
            checked={formDados.entregaUrgente}
            onChange={(e) => setFormDados({...formDados, entregaUrgente: e.target.checked})}
            style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#475569" />
              <label htmlFor="checkbox-urgente" style={{ fontWeight: '600', color: '#0f172a', margin: 0, cursor: 'pointer' }}>
                Entrega Urgente
              </label>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Marcando esta opção, a solicitação entrará em fila de aprovação exclusiva do Administrador.
            </span>
          </div>
        </div>

      </div>

      <div className="selecao-itens-grid">
        <div className="painel-lista">
          <div className="painel-lista-header">
            <h3>Estoque Disponível</h3>
            <span className="badge-contagem">{estoqueDisponivel.length} itens</span>
          </div>
          <div className="pesquisa-estoque">
            <Search size={18} className="icone-pesquisa-estoque" />
            <input type="text" placeholder="Buscar por SAP, PN, Descrição..." />
          </div>
          <div className="lista-rolavel">
            {estoqueDisponivel.map((item, index) => (
              <div key={`estoque-${index}`} className="item-estoque-card" onClick={() => adicionarManualmente(item, index)}>
                <strong className="item-pn">{item.numPecaFabricante}</strong>
                <p className="item-desc">{item.materialDescription}</p>
                <div className="item-rodape">
                  <span className="item-saldo">Saldo: <strong>{item.qtdFornecida} {item.unidadeMedida}</strong></span>
                  <span className="item-alocacao">{item.alocacao}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="painel-lista">
          {/* CABEÇALHO COM OS BOTÕES DE EXCEL ADICIONADOS AQUI */}
          <div className="painel-lista-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#1e293b' }}>
              <Package size={18} color="#2563eb" /> Itens da Solicitação
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <ExemploExcel />
            </div>
          </div>

          {listaSegura.length === 0 ? (
            <div className="estado-vazio-selecao">
              <Package size={48} strokeWidth={1} />
              <p>Clique nos itens à esquerda, adicione uma linha manual ou importe um Excel do SAP</p>
            </div>
          ) : (
            <div className="scroll-tabela-solicitacao">
              <table className="tabela-solicitacao-dados">
                <thead>
                  <tr>
                    <th>AÇÕES</th>
                    <th>MATERIAL DESCRIPTION</th>
                    <th>Nº PEÇA FABRICANTE</th>
                    <th>QTD. SOLICITADA</th>
                    <th>DESENHO SAP</th>
                    <th>FORNECEDOR</th>
                    <th>REFERÊNCIA</th>
                    <th>UNIDADE</th>
                    <th>WBS</th>
                    <th>ALOCAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {listaSegura.map((item) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => removerItem(item.id)} className="btn-deletar-linha">
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <input className="input-editavel-tabela texto-preto" value={item.materialDescription || ''} onChange={(e) => atualizarCampo(item.id, 'materialDescription', e.target.value)} placeholder="Descrição do item" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela badge-partnumber" value={item.numPecaFabricante || ''} onChange={(e) => atualizarCampo(item.id, 'numPecaFabricante', e.target.value)} placeholder="PN" />
                      </td>
                      <td className="qtd-solicitada-destaque">
                        <input type="number" className="input-inline-tabela" value={item.qtdSelecionada || 1} onChange={(e) => atualizarCampo(item.id, 'qtdSelecionada', e.target.value)} />
                      </td>
                      <td>
                        <input className="input-editavel-tabela texto-cinza-claro" value={item.desenhoSAP || ''} onChange={(e) => atualizarCampo(item.id, 'desenhoSAP', e.target.value)} placeholder="SAP" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela texto-cinza-escuro" value={item.fornecedor || ''} onChange={(e) => atualizarCampo(item.id, 'fornecedor', e.target.value)} placeholder="Fornecedor" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela texto-cinza" value={item.referencia || ''} onChange={(e) => atualizarCampo(item.id, 'referencia', e.target.value)} placeholder="Ref" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela texto-cinza" style={{ width: '60px' }} value={item.unidadeMedida || ''} onChange={(e) => atualizarCampo(item.id, 'unidadeMedida', e.target.value)} placeholder="Unid" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela link-azul-fake" value={item.wbs || ''} onChange={(e) => atualizarCampo(item.id, 'wbs', e.target.value)} placeholder="WBS" />
                      </td>
                      <td>
                        <input className="input-editavel-tabela link-azul-fake" value={item.alocacao || ''} onChange={(e) => atualizarCampo(item.id, 'alocacao', e.target.value)} placeholder="Alocação" />
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