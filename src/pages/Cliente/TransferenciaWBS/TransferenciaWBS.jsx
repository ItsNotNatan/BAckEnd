import React, { useState } from 'react';
import './TransferenciaWBS.css';
import { ArrowLeftRight, Search, Send, Trash2 } from 'lucide-react'; 

import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';
import GerenciadorAnexos from '../../../components/GerenciadorAnexos/GerenciadorAnexos';
import { supabase } from '../../../supabaseClient';

const itensDisponiveis = [
  { id: 1, pn: '1534534', desc: 'SENSOR DE INDUÇÃO', wbs: 'BRBCBBB20', qtd: 10 },
  { id: 2, pn: 'PN-TUB-7890', desc: 'Tubo Aço Inox 316L 6" Sch40', wbs: 'WBS-PRJ-2024-001', qtd: 4 },
  { id: 3, pn: 'PN-FLG-1580', desc: 'Flange Cego 4" ANSI 150', wbs: 'WBS-PRJ-2024-001', qtd: 17 },
];

export default function TransferenciaWBS() {
  const [formDados, setFormDados] = useState({
    nome: '',
    wbsDestino: '',
    justificativa: '',
    entregaUrgente: false
  });

  const [itensSelecionados, setItensSelecionados] = useState([]);
  
  // 👇 NOVO ESTADO: Onde o nosso componente vai guardar os ficheiros
  const [anexos, setAnexos] = useState([]);

  const adicionarItem = (item) => {
    if (!itensSelecionados.find(i => i.id === item.id)) {
      setItensSelecionados([...itensSelecionados, { ...item, qtdTransferencia: 1 }]);
    }
  };

  const removerItem = (id) => {
    setItensSelecionados(itensSelecionados.filter(i => i.id !== id));
  };

  const atualizarQuantidade = (id, novaQtd) => {
    const qtdFormatada = Math.max(1, parseInt(novaQtd) || 1);
    setItensSelecionados(itensSelecionados.map(i => 
      i.id === id ? { ...i, qtdTransferencia: qtdFormatada } : i
    ));
  };

  const handleEnviar = async () => {
    if (!formDados.nome || !formDados.wbsDestino) {
      alert("Preencha o Nome do Solicitante e o WBS de Destino.");
      return;
    }

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um item para transferir.");
      return;
    }

    // =========================================================
    // LÓGICA DE UPLOAD DE IMAGENS PARA O SUPABASE STORAGE
    // =========================================================
    const anexosProcessados = [];
    if (anexos.length > 0) {
      for (const arquivo of anexos) {
        const extensao = arquivo.name.split('.').pop();
        const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
        const caminhoNoStorage = `uploads/${nomeUnico}`;

        // Faz o upload para o bucket 'documentos'
        const { error: erroUpload } = await supabase.storage
          .from('documentos')
          .upload(caminhoNoStorage, arquivo);

        if (erroUpload) {
          console.error("Erro ao subir arquivo:", erroUpload);
          alert(`Falha ao anexar o ficheiro: ${arquivo.name}`);
          return; 
        }

        // Pega o Link Público
        const { data: linkPublico } = supabase.storage
          .from('documentos')
          .getPublicUrl(caminhoNoStorage);

        anexosProcessados.push({
          nome_arquivo: arquivo.name,
          url_arquivo: linkPublico.publicUrl
        });
      }
    }

    // =========================================================

    const payload = {
      solicitante: {
        nome: formDados.nome,
        wbs: formDados.wbsDestino,
        observacoes: formDados.justificativa,
        entregaUrgente: formDados.entregaUrgente,
        tipo: 'Transferencia WBS' 
      },
      itens: itensSelecionados.map(item => ({
        numPecaFabricante: item.pn,
        materialDescription: item.desc,
        qtd: item.qtdTransferencia,
        wbsOrigem: item.wbs 
      })),
      anexos: anexosProcessados // Mandamos a lista com os links para o Backend!
    };

    try {
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Transferência solicitada. ID: ${dados.ps_id}`);
        setFormDados({ nome: '', wbsDestino: '', justificativa: '', entregaUrgente: false });
        setItensSelecionados([]);
        setAnexos([]); // Limpa a lista de anexos após enviar
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor.");
    }
  };

  return (
    <>
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone"><ArrowLeftRight size={18} /></div>
            <h2>Dados da Transferência</h2>
          </div>
        </div>

        <div className="form-grid">
          <div className="input-grupo">
            <label>SOLICITANTE *</label>
            <input 
              type="text" 
              className="input-campo" 
              placeholder="Seu nome"
              value={formDados.nome}
              onChange={(e) => setFormDados({...formDados, nome: e.target.value})}
            />
          </div>

          <div className="input-grupo">
            <label>WBS DE DESTINO *</label>
            <input 
              type="text" 
              className="input-campo" 
              placeholder="WBS do projeto destino"
              value={formDados.wbsDestino}
              onChange={(e) => setFormDados({...formDados, wbsDestino: e.target.value})}
            />
          </div>

          <div className="input-grupo span-2">
            <label>JUSTIFICATIVA</label>
            <textarea 
              className="input-campo" 
              placeholder="Motivo da transferência..." 
              rows="2"
              value={formDados.justificativa}
              onChange={(e) => setFormDados({...formDados, justificativa: e.target.value})}
            ></textarea>
          </div>
        </div>

        {/* 👇 O NOVO COMPONENTE INSERIDO AQUI 👇 */}
        <GerenciadorAnexos anexos={anexos} setAnexos={setAnexos} />

      </div>

      <div className="transferencia-grid-inferior">

        {/* COLUNA ESQUERDA - Itens Disponíveis */}
        <div className="coluna-cartao">
          <div className="coluna-esquerda-header">
            <h3>Selecionar Itens para Transferência</h3>
            <div className="pesquisa-itens-wrapper">
              <Search size={16} className="icone-busca-itens" />
              <input type="text" placeholder="Buscar por SAP, PN, Descrição..." />
            </div>
          </div>
          <div className="lista-itens-scroll">
            {itensDisponiveis.map(item => (
              <div 
                key={item.id} 
                className="item-lista" 
                onClick={() => adicionarItem(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="item-lista-pn">{item.pn}</div>
                <div className="item-lista-desc">{item.desc}</div>
                <div>
                  <span className="item-lista-wbs" title="WBS Origem">{item.wbs}</span>
                  <span className="item-lista-qtd">Disponível: {item.qtd}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA DIREITA - Itens Selecionados */}
        <div className="coluna-cartao">
          <div className="coluna-direita-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeftRight size={20} className="icone-header-direita" /> Itens para Transferência
            </div>
            {itensSelecionados.length > 0 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
                {itensSelecionados.length} itens
              </span>
            )}
          </div>

          {itensSelecionados.length === 0 ? (
            <div className="estado-vazio-itens" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Selecione os itens à esquerda para transferir de WBS
            </div>
          ) : (
            <div className="lista-itens-scroll">
              {itensSelecionados.map(item => (
                <div key={`selecionado-${item.id}`} className="item-lista" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ flex: 1 }}>
                    <div className="item-lista-pn">{item.pn}</div>
                    <div className="item-lista-desc">{item.desc}</div>
                    
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>QTD:</label>
                      <input 
                        type="number" 
                        min="1"
                        max={item.qtd}
                        value={item.qtdTransferencia}
                        onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                        style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b', fontSize: '0.875rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {item.qtd}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => removerItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                    title="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-acoes-final mt-4">
        <button className="btn-enviar-azul" onClick={handleEnviar}>
          <Send size={16} /> Confirmar Transferência
        </button>
      </div>
    </>
  );
}