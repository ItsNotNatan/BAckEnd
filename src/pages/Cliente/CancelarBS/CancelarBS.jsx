import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, Search, Loader2 } from 'lucide-react';
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';
import './CancelarBS.css';

export default function CancelarBS() {
  const [listaDeBs, setListaDeBs] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [bsSelecionada, setBsSelecionada] = useState(null); 
  const [carregando, setCarregando] = useState(true);

  // Estados dos novos inputs exigidos na imagem
  const [nomeSolicitante, setNomeSolicitante] = useState('');
  const [justificativa, setJustificativa] = useState('');

  // --- BUSCA OS DADOS REAIS DA API ---
  useEffect(() => {
    const buscarSolicitacoes = async () => {
      try {
        const resposta = await fetch('http://localhost:3001/api/solicitacoes/listar');
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          const bsFormatadas = resultado.dados
            .filter(item => item.status !== 'Cancelado' && item.status !== 'Concluído' && item.status !== 'Recusado')
            .map(item => ({
              id: item.id.replace(/\D/g, ''), 
              idOriginal: item.id,
              solicitante: item.solicitante,
              wbs: item.wbs,
              itens: 1, 
              status: item.status
            }));

          setListaDeBs(bsFormatadas);
        } else {
          console.error("Erro retornado do servidor:", resultado.erro);
        }
      } catch (error) {
        console.error("Falha ao buscar BS do banco:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarSolicitacoes();
  }, []);

  const handleEnviar = async () => {
    if (!bsSelecionada) {
      alert("Por favor, selecione uma BS na lista para prosseguir com o cancelamento.");
      return;
    }

    if (!nomeSolicitante || !justificativa) {
      alert("Por favor, preencha o seu nome e a justificativa para o cancelamento.");
      return;
    }

    const dadosDaBs = listaDeBs.find(b => b.id === bsSelecionada);

    const payload = {
      solicitante: {
        nome: nomeSolicitante, // Usa o nome digitado no formulário
        wbs: dadosDaBs.wbs,
        observacoes: `[CANCELAMENTO] Motivo: ${justificativa} (Origem: ${dadosDaBs.idOriginal})`,
        tipo: 'Cancelado' 
      },
      itens: [] 
    };

    try {
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/cancelamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação de Cancelamento registrada sob o ID: ${dados.ps_id}`);
        setListaDeBs(prev => prev.filter(b => b.id !== bsSelecionada));
        setBsSelecionada(null);
        setPesquisa('');
        setNomeSolicitante('');
        setJustificativa('');
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor backend. Verifique se a API está rodando na porta 3001.");
    }
  };

  const listaFiltrada = listaDeBs.filter(bs => 
    bs.id.includes(pesquisa) || 
    bs.solicitante.toLowerCase().includes(pesquisa.toLowerCase()) ||
    bs.wbs.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="cancelar-wrapper">
      
      {/* AVISO SUPERIOR */}
      <div className="banner-aviso banner-vermelho">
        <AlertTriangle size={24} />
        <div>
          <strong>Cancelamento de BS</strong>
          <p>Selecione os itens e quantidades que retornarão ao estoque. Esta ação não pode ser desfeita.</p>
        </div>
      </div>

      {/* CARTÃO DE PESQUISA */}
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone vermelho"><XCircle size={18} /></div>
            <h2>Selecionar BS para Cancelar</h2>
          </div>
        </div>
        
        <div className="pesquisa-wrapper">
          <Search size={18} className="icone-pesquisa" />
          <input 
            type="text" 
            className="input-campo foco-vermelho" 
            placeholder="Buscar por nº BS, ID ou solicitante..." 
            style={{ paddingLeft: '40px' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)} 
          />
        </div>
        
        {/* LISTA DINÂMICA */}
        <div className="lista-bs-container">
          {carregando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px', color: '#94a3b8' }}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ fontSize: '0.875rem' }}>Buscando boletins ativos...</span>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', marginTop: '16px', padding: '16px' }}>
              Nenhum boletim de saída ativo encontrado para essa busca.
            </p>
          ) : (
            listaFiltrada.map((bs) => (
              <div 
                key={bs.id} 
                className="item-bs"
                style={{
                  border: bsSelecionada === bs.id ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  backgroundColor: bsSelecionada === bs.id ? '#fef2f2' : '#ffffff'
                }}
                onClick={() => setBsSelecionada(bs.id)} 
              >
                <div className="item-bs-info">
                  <span className="item-bs-titulo" style={{ color: bsSelecionada === bs.id ? '#dc2626' : '#1e293b' }}>
                    BS #{bs.id}
                  </span>
                  <span className="item-bs-detalhes">
                    {bs.solicitante.toUpperCase()} - {bs.itens} itens - WBS: {bs.wbs}
                  </span>
                </div>
                
                <div className="item-bs-direita">
                  <span className="badge-separacao">Em Separação</span>
                  
                  {/* Ícones das setas como na imagem */}
                  <div className="setas-ordem">
                    {bsSelecionada === bs.id ? (
                       <div className="seta-bola" style={{ backgroundColor: '#94a3b8' }}></div>
                    ) : (
                      <>
                        <span style={{ fontSize: '10px' }}>▲</span>
                        <span style={{ fontSize: '10px' }}>▼</span>
                      </>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RENDERIZAÇÃO CONDICIONAL: APARECE SÓ SE ESCOLHER UMA BS   */}
      {/* ========================================================= */}
      {bsSelecionada && (
        <>
          {/* TABELA DE ITENS A RETORNAR */}
          <div className="tabela-cancelamento-container">
            <div className="tabela-cancelamento-header">
              <strong>BS #{bsSelecionada} — 1 itens serão devolvidos integralmente ao estoque</strong>
              <span>O cancelamento é total. Todos os itens abaixo retornarão ao saldo de estoque.</span>
            </div>
            <table className="tabela-cancelamento">
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Descrição</th>
                  <th>Qtd a Retornar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'monospace' }}>2967073</td>
                  <td>MODULO DE RELE PLC RSC 24UC 21 21</td>
                  <td className="td-qtd-verde">15 NR</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FORMULÁRIO FINAL E BOTÃO */}
          <div className="form-cartao sem-padding-baixo">
            <div className="form-input-box">
              <label>NOME DO SOLICITANTE *</label>
              <input 
                type="text" 
                className="input-campo foco-vermelho" 
                placeholder="Nome de quem está solicitando o cancelamento" 
                value={nomeSolicitante}
                onChange={(e) => setNomeSolicitante(e.target.value)}
              />
            </div>
            
            <div className="form-input-box">
              <label>JUSTIFICATIVA *</label>
              <textarea 
                className="input-campo foco-vermelho" 
                placeholder="Informe o motivo do cancelamento..."
                rows="3"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              ></textarea>
            </div>

            <BotaoAcaoGlobal 
              texto={`Cancelar BS #${bsSelecionada}`} 
              icone={<XCircle size={16} />} 
              cor="vermelho" 
              onClick={handleEnviar} 
            />
          </div>
        </>
      )}

    </div>
  );
}