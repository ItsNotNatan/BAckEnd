import React, { useState, useEffect } from 'react';

// 👇 MÁGICA: Importamos o CSS do Acompanhamento para ficar 100% igual sem duplicar código!
import '../../Cliente/AcompanhamentoSolicitacoes/AcompanhamentoSolicitacoes.css';

import { 
  Search, 
  ChevronRight, 
  GitBranch, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Zap,
  Loader2,
  Clock
} from 'lucide-react';

// 👇 IMPORTAÇÃO DOS COMPONENTES
import DetalhesSolicitacao from '../../Cliente/AcompanhamentoSolicitacoes/Detalhes/DetalhesSolicitacao';

const obterClasseBadgeTipo = (tipo) => {
  switch (tipo) {
    case 'Transfer. WBS':
    case 'Transferencia WBS': return 'badge-tipo-amarelo';
    case 'Nota Fiscal': return 'badge-tipo-roxo';
    case 'Entrada': return 'badge-tipo-verde';
    case 'Crossdocking': return 'badge-tipo-ciano';
    case 'Reintegração':
    case 'Reintegracao': return 'badge-tipo-laranja';
    case 'Cancelado': return 'badge-tipo-vermelho';
    case 'Material':
    default: return 'badge-tipo-azul';
  }
};

export default function PainelAprovacao() {
  const [dadosTabela, setDadosTabela] = useState([]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  const [linhaExpandida, setLinhaExpandida] = useState(null);

  // --- BUSCA OS DADOS REAIS DA API ---
  useEffect(() => {
    const buscarPendentes = async () => {
      try {
        const resposta = await fetch('http://localhost:3001/api/solicitacoes/listar');
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          
          // Filtramos APENAS os Pendentes e formatamos
          const dadosFormatados = resultado.dados
            .filter(item => item.status === 'Pendente')
            .map((item) => {
              let prefixo = 'PS';
              if (item.tipo === 'Crossdocking') prefixo = 'CD';
              else if (item.tipo === 'Nota Fiscal') prefixo = 'NF';
              else if (item.tipo === 'Transferencia WBS') prefixo = 'TR';
              else if (item.tipo === 'Reintegracao') prefixo = 'REI';
              else if (item.tipo === 'Entrada') prefixo = 'EN';

              const idNumerico = item.id.replace(/\D/g, '');

              return {
                ...item,
                idOriginal: item.id,
                id: idNumerico || item.id,
                prefixo: prefixo,
                dataSolicitacao: item.dataSolicitacao || '-',
                bs: item.bs || '-'
              };
            });

          setDadosTabela(dadosFormatados);

        } else {
          console.error("Erro retornado do servidor:", resultado.erro);
        }
      } catch (error) {
        console.error("Falha ao conectar à API:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarPendentes();
  }, []);

  // FILTRAGEM DE PESQUISA EM TEMPO REAL
  const dadosFiltrados = dadosTabela.filter((linha) => {
    const termoLower = termoPesquisa.toLowerCase();
    return (
      linha.id.toString().toLowerCase().includes(termoLower) ||
      (linha.solicitante && linha.solicitante.toLowerCase().includes(termoLower)) ||
      (linha.wbs && linha.wbs.toLowerCase().includes(termoLower))
    );
  });

  const toggleLinha = (idUnico) => {
    setLinhaExpandida(linhaExpandida === idUnico ? null : idUnico);
  };

  // =========================================================================
  // --- FUNÇÕES DE APROVAÇÃO E RECUSA REAIS (Conectadas ao Backend) ---
  // =========================================================================

  const handleAprovar = async (e, idOriginal) => {
    e.stopPropagation(); // 👈 Impede que a linha se expanda ao clicar no botão

    if (window.confirm(`Tem a certeza que deseja APROVAR a solicitação ${idOriginal} e gerar o BS?`)) {
      try {
        const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idOriginal}/status`, {
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Em Separação' }) 
        });

        if (resposta.ok) {
          alert(`Solicitação ${idOriginal} aprovada! BS gerado com sucesso.`);
          // Remove o item aprovado da tela imediatamente
          setDadosTabela(prev => prev.filter(item => item.idOriginal !== idOriginal));
          setLinhaExpandida(null);
        } else {
          const erro = await resposta.json();
          alert(`Erro ao aprovar: ${erro.mensagem || 'Falha no servidor.'}`);
        }
      } catch (error) {
        console.error("Erro na requisição de aprovação:", error);
        alert("Erro ao conectar com o servidor. Verifique se o backend está a rodar.");
      }
    }
  };

  const handleRecusar = async (e, idOriginal) => {
    e.stopPropagation(); // 👈 Impede que a linha se expanda ao clicar no botão

    const motivo = window.prompt(`Qual o motivo da reprovação para a solicitação ${idOriginal}?`);
    
    if (motivo) {
      try {
        const resposta = await fetch(`http://localhost:3001/api/solicitacoes/${idOriginal}/status`, {
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'Recusado',
            motivo_recusa: motivo 
          }) 
        });

        if (resposta.ok) {
          alert(`Solicitação ${idOriginal} reprovada com sucesso.`);
          // Remove o item recusado da tela imediatamente
          setDadosTabela(prev => prev.filter(item => item.idOriginal !== idOriginal));
          setLinhaExpandida(null);
        } else {
          const erro = await resposta.json();
          alert(`Erro ao reprovar: ${erro.mensagem || 'Falha no servidor.'}`);
        }
      } catch (error) {
        console.error("Erro na requisição de recusa:", error);
        alert("Erro ao conectar com o servidor. Verifique se o backend está a rodar.");
      }
    }
  };

  return (
    <div className="acompanhamento-wrapper">

      {/* CABEÇALHO */}
      <header className="acompanhamento-cabecalho">
        <h1>Painel de Aprovação</h1>
        <p>Aprove rapidamente solicitações pendentes para gerar o Boletim de Saída (BS).</p>
      </header>

      {/* TABELA */}
      <div className="tabela-cartao-container">
        
        <div className="tabela-controlos-topo">
          <div className="filtros-botoes">
            <button className="btn-aba ativo" style={{ cursor: 'default' }}>
              <Clock size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '6px' }} />
              Aguardando Aprovação ({dadosFiltrados.length})
            </button>
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
          {carregando ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '40px', color: '#94a3b8' }}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ fontSize: '0.875rem' }}>Buscando solicitações pendentes...</span>
            </div>
          ) : dadosFiltrados.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', display: 'block' }} />
              Nenhuma solicitação pendente no momento. Bom trabalho!
            </div>
          ) : (
            <table className="tabela-solicitacoes">
              <thead>
                <tr>
                  <th className="col-chevron"></th>
                  <th>TIPO</th>
                  <th>ID / SOLICITANTE / WBS</th>
                  <th>DATA CRIAÇÃO</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>AÇÕES</th> 
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((linha, index) => {
                  const idUnico = `${linha.prefixo}-${linha.id}-${index}`;
                  const isExpandida = linhaExpandida === idUnico;
                  
                  return (
                    <React.Fragment key={idUnico}>
                      
                      <tr className={isExpandida ? 'tr-expandida' : ''} style={{ cursor: 'pointer' }} onClick={() => toggleLinha(idUnico)}>
                        <td className="col-chevron">
                          <ChevronRight size={18} className={isExpandida ? 'icone-rotacionado' : 'icone-normal'} style={{ color: '#94a3b8' }} />
                        </td>
                        
                        <td>
                          <div className="bloco-tipo-id">
                            <span className={`badge-tipo ${obterClasseBadgeTipo(linha.tipo)} ${linha.entregaUrgente ? 'badge-urgente-critico' : ''}`}>
                              {linha.entregaUrgente ? <Zap size={13} color="#ef4444" fill="#ef4444" /> : <GitBranch size={13} />} 
                              {linha.tipo}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1e293b' }}>
                              {linha.prefixo || 'PS'}:{linha.id}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                              {linha.solicitante}
                            </span>
                            {linha.wbs && (
                              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '500' }}>
                                {linha.wbs}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="texto-data">{linha.dataSolicitacao}</td>
                        
                        <td>
                          <span className="badge-status status-separacao" style={{ backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                            <Clock size={14} /> Pendente
                          </span>
                        </td>

                        {/* 👇 CÉLULA COM OS BOTÕES DE AÇÃO DIRETOS NA LINHA */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {/* 👇 BOTÃO REPROVAR ATUALIZADO AQUI */}
                            <button 
                              onClick={(e) => handleRecusar(e, linha.idOriginal)}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                                backgroundColor: '#ffffff', color: '#ef4444', border: '1px solid #fecaca', 
                                borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              title="Reprovar Solicitação"
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                            >
                              <XCircle size={16} /> Reprovar
                            </button>

                            <button 
                              onClick={(e) => handleAprovar(e, linha.idOriginal)}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                                backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', 
                                fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
                            >
                              <CheckCircle2 size={16} /> Aprovar e Gerar BS
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* GAVETA DE DETALHES */}
                      {isExpandida && (
                        <tr>
                          <td colSpan={6} className="td-expandida">
                            <DetalhesSolicitacao item={linha} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}