import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { 
  Settings, ClipboardList, FileCheck2, Clock, Activity, 
  Target, CheckCircle2, XCircle, BarChart3, TrendingUp, 
  FileText, Download, AlertTriangle, Loader2 
} from 'lucide-react';
import TabelaDemandas from '../../../components/TabelaDemandas/TabelaDemandas';

export default function Dashboard() {
  // ============================================================================
  // 1. ESTADOS GERAIS
  // ============================================================================
  const [dadosTabela, setDadosTabela] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // O motor do cronómetro (atualizado a cada segundo)
  const [tempoAtual, setTempoAtual] = useState(new Date());

  // ============================================================================
  // 2. BUSCAR DADOS REAIS DO BACKEND (A Fonte da Verdade)
  // ============================================================================
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const resposta = await fetch('http://localhost:3001/api/solicitacoes/listar');
        const resultado = await resposta.json();

        if (resposta.ok && resultado.sucesso) {
          // Mapeamos os dados para que a TabelaDemandas os entenda
          const dadosFormatados = resultado.dados.map((item) => ({
            id: `PS:${item.id.replace(/\D/g, '') || item.id}`,
            solicitante: item.solicitante,
            wbs: item.wbs,
            status: item.status,
            bs: item.bs || '-',
            criacaoBs: item.dataSolicitacao, // Usaremos isto para o cálculo!
            dataEntrega: item.dataEntrega || 'não definido'
          }));
          
          setDadosTabela(dadosFormatados);
        }
      } catch (error) {
        console.error("Erro ao carregar os dados do Dashboard:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  // ============================================================================
  // 3. MOTOR DO RELÓGIO (Atualiza a página a cada 1 segundo)
  // ============================================================================
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTempoAtual(new Date());
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // ============================================================================
  // 4. LÓGICA MATEMÁTICA DO CRONÓMETRO
  // ============================================================================
  
  // Função A: Converte "23/06/2026 14:14" para um objeto de Data legível pelo JS
  const parseDataBackend = (dataStr) => {
    if (!dataStr || typeof dataStr !== 'string' || !dataStr.includes('/')) return null;
    try {
      const [dataParte, horaParte] = dataStr.split(' ');
      const [dia, mes, ano] = dataParte.split('/');
      const [hora, minuto] = horaParte.split(':');
      return new Date(ano, mes - 1, dia, hora, minuto);
    } catch (e) {
      return null;
    }
  };

  // Função B: O cálculo do tempo restante
  const calcularTempoRestante = (dataStr, status) => {
    if (status === 'Concluído') return { texto: 'Entregue', cor: 'neutro' };
    if (status === 'Cancelado' || status === 'Recusado') return { texto: 'Cancelado', cor: 'neutro' };
    
    const dataCriacao = parseDataBackend(dataStr);
    if (!dataCriacao) return { texto: '—', cor: 'neutro' };

    // Nosso Target é 3 dias (3 dias * 24 horas * 60 min * 60 seg * 1000 ms)
    const prazoTargetMs = 3 * 24 * 60 * 60 * 1000; 
    
    // O momento exato em que o prazo se esgota
    const dataLimite = new Date(dataCriacao.getTime() + prazoTargetMs);
    
    // Quanto tempo falta entre o limite e o EXATO SEGUNDO de agora
    const diferencaMs = dataLimite.getTime() - tempoAtual.getTime();
    
    const pad = (num) => String(num).padStart(2, '0');

    if (diferencaMs < 0) {
      // 🚨 ATRASADO
      const atrasoAbsoluto = Math.abs(diferencaMs);
      const dias = Math.floor(atrasoAbsoluto / (1000 * 60 * 60 * 24));
      const horas = Math.floor((atrasoAbsoluto / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((atrasoAbsoluto / 1000 / 60) % 60);
      const segundos = Math.floor((atrasoAbsoluto / 1000) % 60);
      return { texto: `-${dias}d ${pad(horas)}:${pad(minutos)}:${pad(segundos)}`, cor: 'vermelho' };
    } else {
      // ✅ NO PRAZO
      const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencaMs / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diferencaMs / 1000 / 60) % 60);
      const segundos = Math.floor((diferencaMs / 1000) % 60);
      const corStatus = dias === 0 ? 'amarelo' : 'verde';
      return { texto: `${dias}d ${pad(horas)}:${pad(minutos)}:${pad(segundos)}`, cor: corStatus };
    }
  };

  // Preparamos a lista injetando o cronómetro calculado no momento
  const dadosTabelaAoVivo = dadosTabela.map(item => {
    const contagemAoVivo = calcularTempoRestante(item.criacaoBs, item.status);
    return {
      ...item,
      contagem: contagemAoVivo.texto,
      contagemStatus: contagemAoVivo.cor
    };
  });

  return (
    <div className="dashboard-container">
      
      {/* --- CABEÇALHO --- */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard de Operações</h1>
          <p>Métricas de desempenho e visão geral da logística</p>
        </div>
        <div className="header-actions">
          <div className="target-badge">
            <Settings size={16} />
            <span>Target Atual: <strong>3 Dias</strong></span>
          </div>
          <select className="period-select">
            <option>Todo Período</option>
            <option>Este Mês</option>
            <option>Semana Passada</option>
          </select>
        </div>
      </header>

      {/* --- CARDS SUPERIORES (KPIs Dinâmicos!) --- */}
      <div className="cards-grid">
        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Solicitações Recebidas</h3>
            <div className="icon-wrapper icon-blue"><ClipboardList size={20} /></div>
          </div>
          <p className="card-value value-blue">{carregando ? '-' : dadosTabela.length}</p>
          <p className="card-description">Total de PS no período</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Aguardando Aprovação</h3>
            <div className="icon-wrapper icon-orange"><Clock size={20} /></div>
          </div>
          <p className="card-value value-orange">
            {carregando ? '-' : dadosTabela.filter(i => i.status === 'Pendente').length}
          </p>
          <p className="card-description">Pendentes na fila</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Em Separação</h3>
            <div className="icon-wrapper icon-blue"><Activity size={20} /></div>
          </div>
          <p className="card-value value-blue">
            {carregando ? '-' : dadosTabela.filter(i => i.status === 'Em Separação').length}
          </p>
          <p className="card-description">Sendo processados agora</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Finalizados</h3>
            <div className="icon-wrapper icon-blue"><CheckCircle2 size={20} /></div>
          </div>
          <p className="card-value value-blue">
            {carregando ? '-' : dadosTabela.filter(i => i.status === 'Concluído').length}
          </p>
          <p className="card-description">Demandas entregues</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECÇÃO: EFICIÊNCIA DE ATENDIMENTO                            */}
      {/* ============================================================ */}
      <div className="efficiency-section">
        <div className="efficiency-header">
          <div className="efficiency-icon">
            <Target size={20} />
          </div>
          <div className="efficiency-textos">
            <h2>Eficiência de Atendimento</h2>
            <p>Lead time: Data Criação &rarr; Data de Finalização &middot; Target: 3 dia(s)</p>
          </div>
        </div>

        <div className="efficiency-grid">
          <div className="eff-card green">
            <CheckCircle2 size={24} strokeWidth={1.5} />
            <span>Dentro do Target</span>
            <strong>0</strong>
          </div>
          <div className="eff-card red">
            <XCircle size={24} strokeWidth={1.5} />
            <span>Fora do Target</span>
            <strong>0</strong>
          </div>
          <div className="eff-card gray">
            <BarChart3 size={24} strokeWidth={1.5} />
            <span>Total Avaliado</span>
            <strong>0</strong>
          </div>
        </div>
        <p className="efficiency-footer">Nenhum BS concluído ainda para cálculo de eficiência.</p>
      </div>

      {/* ============================================================ */}
      {/* LINHA 1 DE GRÁFICOS (2 Colunas)                              */}
      {/* ============================================================ */}
      <div className="graficos-grid-2col">
        {/* GRÁFICO 1 */}
        <div className="grafico-card">
          <div className="grafico-header">
            <div className="grafico-titulo-grupo">
              <div className="grafico-icone"><TrendingUp size={18} /></div>
              <div className="grafico-textos">
                <h3>Dentro vs. Fora do Target</h3>
                <p>% sobre finalizados por mês · variação mês a mês</p>
              </div>
            </div>
            <button className="btn-csv"><Download size={14}/> CSV</button>
          </div>

          <div className="meses-selecao">
            {['jan/26', 'fev/26', 'mar/26', 'abr/26', 'mai/26', 'jun/26'].map(mes => (
              <div key={mes} className="mes-box"><span>{mes}</span><span style={{color: '#cbd5e1'}}>—</span></div>
            ))}
          </div>

          <div className="grafico-area">
            <div className="grafico-eixo-y">
              <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
            </div>
            <div className="grafico-linhas">
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal" style={{borderTopStyle: 'solid'}}></div>
            </div>
            <div className="grafico-eixo-x">
              <span>jan/26</span><span>fev/26</span><span>mar/26</span><span>abr/26</span><span>mai/26</span><span>jun/26</span>
            </div>
          </div>
          <div className="grafico-legenda">
            <div className="legenda-item"><div className="legenda-cor verde"></div> Dentro (%)</div>
            <div className="legenda-item"><div className="legenda-cor vermelha"></div> Fora (%)</div>
          </div>
        </div>

        {/* GRÁFICO 2 */}
        <div className="grafico-card">
          <div className="grafico-header">
            <div className="grafico-titulo-grupo">
              <div className="grafico-icone"><FileText size={18} /></div>
              <div className="grafico-textos">
                <h3>Acompanhamento de BS por Status</h3>
                <p>Finalizados · Recusados · Em Andamento</p>
              </div>
            </div>
            <button className="btn-csv"><Download size={14}/> CSV</button>
          </div>

          <div className="status-caixas-grid">
            <div className="status-box status-verde"><span>Finalizados</span><strong>{dadosTabela.filter(i => i.status === 'Concluído').length}</strong></div>
            <div className="status-box status-vermelho"><span>Recusados</span><strong>{dadosTabela.filter(i => i.status === 'Recusado' || i.status === 'Cancelado').length}</strong></div>
            <div className="status-box status-azul"><span>Em Andamento</span><strong>{dadosTabela.filter(i => i.status === 'Em Separação').length}</strong></div>
          </div>

          <div className="grafico-area">
            <div className="grafico-eixo-y"><span>12</span><span>9</span><span>6</span><span>3</span><span>0</span></div>
            <div className="grafico-linhas">
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal" style={{borderTopStyle: 'solid'}}></div>
            </div>
            <div className="grafico-barras">
              <div className="barra-container"><span className="barra-label-topo" style={{opacity: 0}}>0</span><div className="barra-preenchimento verde" style={{height: '0%'}}></div></div>
              <div className="barra-container"><span className="barra-label-topo">1</span><div className="barra-preenchimento vermelha" style={{height: '8.3%'}}></div></div>
              <div className="barra-container"><span className="barra-label-topo">11</span><div className="barra-preenchimento azul" style={{height: '91.6%'}}></div></div>
            </div>
            <div className="grafico-eixo-x" style={{padding: '0 30px'}}>
              <span>Finalizados</span><span>Recusados</span><span>Em Andamento</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LINHA 3: TABELA DE DEMANDAS DE PICKING COM O CRONÓMETRO      */}
      {/* ============================================================ */}
      <div className="graficos-grid-1col" style={{ marginTop: '24px' }}>
         {carregando ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#94a3b8', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
             <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
             <span>A sincronizar os dados do servidor...</span>
           </div>
         ) : (
           <TabelaDemandas dados={dadosTabelaAoVivo} />
         )}
      </div>

    </div>
  );
}