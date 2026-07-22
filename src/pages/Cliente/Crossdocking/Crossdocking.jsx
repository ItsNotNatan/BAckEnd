import React, { useState } from 'react';
import { Package, User, Upload, Send, Plus, Trash2, AlertTriangle, FileText } from 'lucide-react'; // 👈 FileText importado para o ícone da NF
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

// IMPORTAÇÕES PARA OS ANEXOS FUNCIONAREM
import GerenciadorAnexos from '../../../components/GerenciadorAnexos/GerenciadorAnexos';
import { supabase } from '../../../supabaseClient';

import './Crossdocking.css';

export default function Crossdocking() {
  // 1. ESTADO: Dados gerais do formulário
  const [formDados, setFormDados] = useState({
    nome: '',
    wbs: '',
    observacoes: '',
    nf: '' // ✨ NOVO: Estado para guardar o número da Nota Fiscal
  });
  
  // Estado para o tipo de saída (parcial ou total)
  const [tipoSaida, setTipoSaida] = useState(null);

  // Estado para controlar as linhas da tabela de Saída Parcial
  const [itensParciais, setItensParciais] = useState([
    { id: Date.now(), desenhoSAP: '', quantidade: '', unidade: 'Unid' }
  ]);

  // ESTADO PARA OS ARQUIVOS DA NOTA FISCAL
  const [anexos, setAnexos] = useState([]);

  // --- FUNÇÕES DA TABELA PARCIAL ---
  const adicionarItemParcial = () => {
    setItensParciais([
      ...itensParciais,
      { id: Date.now(), desenhoSAP: '', quantidade: '', unidade: 'Unid' }
    ]);
  };

  const removerItemParcial = (id) => {
    if (itensParciais.length > 1) {
      setItensParciais(itensParciais.filter(item => item.id !== id));
    } else {
      alert("Para Saída Parcial, adicione pelo menos 1 item.");
    }
  };

  const atualizarItemParcial = (id, campo, valor) => {
    setItensParciais(itensParciais.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  // 2. FUNÇÃO DE ENVIO PARA O BACKEND (NODE.JS)
  const handleEnviar = async () => {
    // ✨ NOVO: Validação agora inclui a NF
    if (!formDados.nome || !formDados.wbs || !formDados.nf || !tipoSaida) {
      alert("Por favor, preencha o Nome, WBS, Número da NF e selecione o Tipo de Saída.");
      return;
    }

    // Validação da Nota Fiscal em anexo (obrigatório para Crossdocking)
    if (anexos.length === 0) {
      alert("A anexação do documento da Nota Fiscal (PDF ou XML) é obrigatória para operações de Crossdocking.");
      return;
    }

    // Se for parcial, valida se preencheu os itens da tabela
    if (tipoSaida === 'parcial') {
      const temItemIncompleto = itensParciais.some(i => !i.desenhoSAP || !i.quantidade);
      if (temItemIncompleto) {
        alert("Preencha o Desenho SAP e a Quantidade em todas as linhas da Saída Parcial.");
        return;
      }
    }

    // =========================================================
    // LÓGICA DE UPLOAD DE IMAGENS PARA O SUPABASE STORAGE
    // =========================================================
    const anexosProcessados = [];
    for (const arquivo of anexos) {
      const extensao = arquivo.name.split('.').pop();
      const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
      const caminhoNoStorage = `uploads/${nomeUnico}`;

      const { error: erroUpload } = await supabase.storage
        .from('documentos')
        .upload(caminhoNoStorage, arquivo);

      if (erroUpload) {
        console.error("Erro ao subir arquivo:", erroUpload);
        alert(`Falha ao anexar o ficheiro: ${arquivo.name}`);
        return; 
      }

      const { data: linkPublico } = supabase.storage
        .from('documentos')
        .getPublicUrl(caminhoNoStorage);

      anexosProcessados.push({
        nome_arquivo: arquivo.name,
        url_arquivo: linkPublico.publicUrl
      });
    }
    // =========================================================

    // Prepara os itens para o payload (se for total, vai lista vazia; se parcial, mapeia)
    const listaItensFinais = tipoSaida === 'total' 
      ? [] 
      : itensParciais.map(i => ({
          desenho_sap_manual: i.desenhoSAP,
          quantidade_solicitada: parseFloat(i.quantidade),
          unidade_medida_manual: i.unidade
        }));

    // Prepara o pacote com o tipo correspondente para o banco de dados
    const payload = {
      solicitante: {
        nome: formDados.nome,
        wbs: formDados.wbs,
        nf: formDados.nf, // ✨ NOVO: A NF viaja aqui para o Backend
        observacoes: `[Saída ${tipoSaida === 'total' ? 'Total' : 'Parcial'}] ${formDados.observacoes}`,
        tipo: 'Crossdocking'
      },
      itens: listaItensFinais,
      anexos: anexosProcessados // Mandamos os links gerados para o backend
    };

    try {
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/crossdocking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação de Crossdocking enviada. ID: ${dados.ps_id}`);
        // Limpa os campos após o sucesso
        setFormDados({ nome: '', wbs: '', observacoes: '', nf: '' });
        setTipoSaida(null);
        setItensParciais([{ id: Date.now(), desenhoSAP: '', quantidade: '', unidade: 'Unid' }]);
        setAnexos([]); // Limpa a lista de arquivos
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor. Verifique se o backend está rodando.");
    }
  };

  return (
    <div className="limitador-largura">
      
      {/* AVISO SUPERIOR */}
      <div className="banner-aviso banner-ciano">
        <Package size={24} />
        <div>
          <strong>Crossdocking</strong>
          <p>Saída Total processa toda a NF. Saída Parcial permite informar múltiplos itens por Desenho SAP + quantidade.</p>
        </div>
      </div>

      {/* DADOS DO SOLICITANTE */}
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone ciano redondo"><User size={18} /></div>
            <h2>Dados do Solicitante</h2>
          </div>
        </div>
        <div className="form-grid">
          <div className="input-grupo">
            <label>NOME *</label>
            <input 
              type="text" 
              className="input-campo foco-ciano" 
              placeholder="Seu nome completo" 
              value={formDados.nome}
              onChange={(e) => setFormDados({...formDados, nome: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label>WBS *</label>
            <input 
              type="text" 
              className="input-campo foco-ciano" 
              placeholder="WBS do projeto" 
              value={formDados.wbs}
              onChange={(e) => setFormDados({...formDados, wbs: e.target.value})}
            />
          </div>
          
          {/* ✨ NOVO: Campo obrigatório do Número da Nota Fiscal */}
          <div className="input-grupo">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} color="#2563eb" /> NÚMERO DA NOTA FISCAL *
            </label>
            <input 
              type="text" 
              className="input-campo foco-ciano" 
              placeholder="Ex: 123456" 
              value={formDados.nf}
              onChange={(e) => setFormDados({...formDados, nf: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* DADOS DA OPERAÇÃO */}
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone ciano"><Package size={18} /></div>
            <h2>Dados da Operação</h2>
          </div>
        </div>
        <div className="form-grid coluna-unica">
          
          <div style={{ marginBottom: '8px' }}>
             <GerenciadorAnexos anexos={anexos} setAnexos={setAnexos} titulo="NOTA FISCAL (OBRIGATÓRIO)" />
          </div>
          
          <div className="input-grupo">
            <label>TIPO DE SAÍDA *</label>
            <div className="botoes-toggle-container">
              <button 
                className={`btn-toggle ${tipoSaida === 'parcial' ? 'selecionado' : ''}`} 
                onClick={() => setTipoSaida('parcial')}
              >
                Saída Parcial
              </button>
              <button 
                className={`btn-toggle ${tipoSaida === 'total' ? 'selecionado' : ''}`} 
                onClick={() => setTipoSaida('total')}
              >
                Saída Total
              </button>
            </div>
          </div>

          {/* ========================================================
             RENDERIZAÇÃO CONDICIONAL: TABELA DE SAÍDA PARCIAL
             ======================================================== */}
          {tipoSaida === 'parcial' && (
            <div style={{ marginTop: '16px', animation: 'fadeIn 0.2s ease-in-out' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Saída Parcial — adicione todos os itens da NF que serão separados
                </span>
                <button 
                  onClick={adicionarItemParcial}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Adicionar Item
                </button>
              </div>

              {/* Tabela de Itens Parciais */}
              <div className="scroll-tabela-solicitacao" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', backgroundColor: '#f8fafc' }}>
                <table className="tabela-solicitacao-dados" style={{ minWidth: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ width: '40px', padding: '8px' }}>#</th>
                      <th>DESENHO SAP *</th>
                      <th style={{ width: '150px' }}>QUANTIDADE *</th>
                      <th style={{ width: '120px' }}>UNIDADE</th>
                      <th style={{ width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensParciais.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500', padding: '8px' }}>{index + 1}</td>
                        <td>
                          <input 
                            type="text" 
                            className="input-campo foco-ciano" 
                            style={{ backgroundColor: '#ffffff' }}
                            placeholder="Ex: 12345-A" 
                            value={item.desenhoSAP}
                            onChange={(e) => atualizarItemParcial(item.id, 'desenhoSAP', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input-campo foco-ciano" 
                            style={{ backgroundColor: '#ffffff' }}
                            min="1" 
                            placeholder="0"
                            value={item.quantidade}
                            onChange={(e) => atualizarItemParcial(item.id, 'quantidade', e.target.value)}
                          />
                        </td>
                        <td>
                          <select 
                            className="input-campo foco-ciano" 
                            style={{ backgroundColor: '#ffffff', appearance: 'auto', padding: '8px' }}
                            value={item.unidade}
                            onChange={(e) => atualizarItemParcial(item.id, 'unidade', e.target.value)}
                          >
                            <option value="Unid">Unid</option>
                            <option value="Kg">Kg</option>
                            <option value="Metro">Metro</option>
                            <option value="Caixa">Caixa</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => removerItemParcial(item.id)} 
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px', paddingLeft: '8px' }}>
                  &rarr; {itensParciais.length} item(ns) configurado(s)
                </div>
              </div>

            </div>
          )}

          <div className="input-grupo">
            <label>OBSERVAÇÕES</label>
            <textarea 
              className="input-campo foco-ciano" 
              placeholder="Informações adicionais..."
              value={formDados.observacoes}
              onChange={(e) => setFormDados({...formDados, observacoes: e.target.value})}
            ></textarea>
          </div>
        </div>
      </div>

      <BotaoAcaoGlobal 
        texto="Enviar Crossdocking" 
        icone={<Send size={16} />} 
        cor="ciano" 
        onClick={handleEnviar} 
      />
      
    </div>
  );
}