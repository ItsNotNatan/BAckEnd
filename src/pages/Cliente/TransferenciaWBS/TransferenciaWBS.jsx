import React, { useState, useEffect, useContext } from 'react';
import './TransferenciaWBS.css';
import { Send, Trash2, Box } from 'lucide-react'; 

import GerenciadorAnexos from '../../../components/GerenciadorAnexos/GerenciadorAnexos';
import SeletorEstoqueLateral from '../../../components/SeletorEstoqueLateral/SeletorEstoqueLateral';
import { supabase } from '../../../supabaseClient';

// Importamos o AuthContext para saber em qual Filial estamos
import { AuthContext } from '../../../contexts/AuthContext';

export default function TransferenciaWBS() {
  // Puxamos a filial global (estoqueAtual)
  const { estoqueAtual } = useContext(AuthContext);

  // --- 1. ESTADOS DO FORMULÁRIO E ITENS ---
  const [formDados, setFormDados] = useState({
    nome: '',
    wbsDestino: '',
    justificativa: '',
    entregaUrgente: false
  });

  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [anexos, setAnexos] = useState([]);

  // --- 2. ESTADOS PARA O ESTOQUE REAL ---
  const [estoqueReal, setEstoqueReal] = useState([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(true);

  // --- 3. BUSCAR DADOS REAIS DO BACKEND (Filtrado por Filial Ativa) ---
  useEffect(() => {
    // ✨ Se estiver em modo "TODOS" ou sem filial, limpa o estoque da tela e aborta
    if (!estoqueAtual || estoqueAtual === 'TODOS') {
      setEstoqueReal([]);
      setCarregandoEstoque(false);
      return;
    }

    const carregarEstoque = async () => {
      try {
        setCarregandoEstoque(true);
        // ✨ Passamos a filial ativa como query parameter para o backend buscar o estoque correto
        const resposta = await fetch(`http://localhost:3001/api/estoque/listar?filial_id=${estoqueAtual}`);
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          // Filtra apenas itens que tenham saldo maior que zero
          const itensComSaldo = resultado.dados.filter(item => item.quantidade_disponivel > 0);
          setEstoqueReal(itensComSaldo);
        } else {
          console.error("Erro ao buscar estoque:", resultado.erro);
        }
      } catch (error) {
        console.error("Falha de conexão ao buscar estoque:", error);
      } finally {
        setCarregandoEstoque(false);
      }
    };

    carregarEstoque();
    // ✨ Adicionado estoqueAtual como dependência para recarregar o estoque ao mudar de filial
  }, [estoqueAtual]); 

  // --- 4. FUNÇÕES DE CÁLCULO DE SALDO ---
  const getQuantidadeJaSelecionada = (idItem) => {
    const itemNoCarrinho = itensSelecionados.find(i => i.id === idItem);
    return itemNoCarrinho ? itemNoCarrinho.qtdTransferencia : 0;
  };

  const getSaldoRestante = (item) => {
    return item.quantidade_disponivel - getQuantidadeJaSelecionada(item.id);
  };

  // --- 5. AÇÕES DO CARRINHO ---
  const adicionarItem = (itemOriginal) => {
    if (getSaldoRestante(itemOriginal) > 0 && !itensSelecionados.find(i => i.id === itemOriginal.id)) {
      setItensSelecionados([
        ...itensSelecionados, 
        { ...itemOriginal, qtdTransferencia: 1 }
      ]);
    }
  };

  const removerItem = (id) => {
    setItensSelecionados(itensSelecionados.filter(i => i.id !== id));
  };

  const atualizarQuantidade = (idOriginal, novaQtd) => {
    const itemEstoque = estoqueReal.find(i => i.id === idOriginal);
    if (!itemEstoque) return;

    let qtdFormatada = parseInt(novaQtd) || 1;
    
    if (qtdFormatada > itemEstoque.quantidade_disponivel) {
      qtdFormatada = itemEstoque.quantidade_disponivel;
    }
    if (qtdFormatada < 1) {
      qtdFormatada = 1;
    }

    setItensSelecionados(itensSelecionados.map(i => 
      i.id === idOriginal ? { ...i, qtdTransferencia: qtdFormatada } : i
    ));
  };

  // --- 6. ENVIO PARA O BACKEND ---
  const handleEnviar = async () => {
    // ✨ TRAVA MÁGICA: Impede o envio se estiver na visão global "TODOS"
    if (!estoqueAtual || estoqueAtual === 'TODOS') {
      alert("Por favor, selecione uma filial de origem específica (ex: BR02) no topo da página antes de solicitar uma transferência.");
      return;
    }

    if (!formDados.nome || !formDados.wbsDestino) {
      alert("Preencha o Nome do Solicitante e o WBS de Destino.");
      return;
    }

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um item para transferir.");
      return;
    }

    const anexosProcessados = [];
    if (anexos.length > 0) {
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
    }

    // ✨ INJEÇÃO DIRETA: Removido o '|| BR06'. O payload usa estritamente o cabeçalho.
    const payload = {
      solicitante: {
        nome: formDados.nome,
        wbs: formDados.wbsDestino,
        observacoes: formDados.justificativa,
        entregaUrgente: formDados.entregaUrgente,
        tipo: 'Transferencia WBS',
        filial_origem: estoqueAtual 
      },
      itens: itensSelecionados.map(item => ({
        estoque_id: item.id,
        numPecaFabricante: item.part_number,
        materialDescription: item.descricao,
        qtd: item.qtdTransferencia,
        wbsOrigem: item.wbs,
        alocacao: item.alocacao 
      })),
      anexos: anexosProcessados 
    };

    try {
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Transferência solicitada. PS Gerada: ${dados.ps}`);
        setFormDados({ nome: '', wbsDestino: '', justificativa: '', entregaUrgente: false });
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

  return (
    <>
      <div className="form-cartao">
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

        <GerenciadorAnexos anexos={anexos} setAnexos={setAnexos} />
      </div>

      <div className="transferencia-grid-inferior">

        <SeletorEstoqueLateral 
          estoque={estoqueReal}
          carregando={carregandoEstoque}
          onAdicionarItem={adicionarItem}
          calcularSaldo={getSaldoRestante}
        />

        {/* COLUNA DIREITA: ITENS SELECIONADOS */}
        <div className="coluna-cartao">
          <div className="coluna-direita-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
              <Box size={20} color="#2563eb" /> Itens Selecionados
            </div>
            <span className="badge-contador-simples">{itensSelecionados.length} itens</span>
          </div>

          {itensSelecionados.length === 0 ? (
            <div className="estado-vazio-itens" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Clique num item do estoque para adicionar à transferência.
            </div>
          ) : (
            <div className="lista-itens-scroll">
              {itensSelecionados.map(item => (
                <div key={`selecionado-${item.id}`} className="item-lista" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '6px' }}><span className="badge-sap" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>{item.desenho_sap}</span></div>
                    <div className="item-lista-pn" style={{ marginBottom: '4px' }}>{item.part_number}</div>
                    <div className="item-lista-desc">{item.descricao}</div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>QTD:</label>
                      <input 
                        type="number" 
                        min="1"
                        max={item.quantidade_disponivel}
                        value={item.qtdTransferencia}
                        onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                        style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', color: '#1e293b', fontSize: '0.875rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {item.quantidade_disponivel} (Total Original)</span>
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