import React from 'react';
import './Dashboard.css';
import { 
  Settings, ClipboardList, FileCheck2, Clock, Activity, 
  Target, CheckCircle2, XCircle, BarChart3, TrendingUp, 
  FileText, Download, AlertTriangle 
} from 'lucide-react';
import TabelaDemandas from'../../../components/TabelaDemandas/TabelaDemandas';

// DADOS MOCKADOS DA TABELA DE PICKING (Baseado na tua imagem)
const mockDemandas = [
  { id: 'PS: 0707261449', filial: 'BR01', urgencia: 'High', wbs: 'BRRRRCY21-SPT', tempoEspera: '0d 45m', status: 'Em Separação - No Prazo', statusCor: 'demanda-verde', bs: 'SP-BS 10999', criacao: '07/07/2026 17:49', finalizacao: 'não definido', leadTime: '0d 45m', target: '–', itens: 1, valorTotal: '10d 15m' },
  { id: 'PS: 0707261441', filial: 'BR02', urgencia: 'Medium', wbs: 'BRRRRCY21-SPT', tempoEspera: '0d 45m', status: 'Em Separação - Crítico', statusCor: 'demanda-amarela', bs: 'SP-BS 10985', criacao: '07/07/2026 13:38', finalizacao: 'não definido', leadTime: '0d 45m', target: '–', itens: 1, valorTotal: '0d 32m' },
  { id: 'PS: 0707260938', filial: 'BR04', urgencia: 'Low', wbs: 'BRRRRCY21-SPT', tempoEspera: '0d 45m', status: 'Em Atraso', statusCor: 'demanda-vermelha', bs: 'SP-BS 10977', criacao: '07/07/2026 15:08', finalizacao: 'não definido', leadTime: '0d 15m', target: '–', itens: 2, valorTotal: '0d 15m' },
  { id: 'PS: 0687261410', filial: 'BR04', urgencia: 'Low', wbs: 'BRRRRBA32-MA...', tempoEspera: '0d 45m', status: 'Concluído', statusCor: 'demanda-cinza', bs: 'SP-BS 10983', criacao: '06/07/2026 17:16', finalizacao: 'não definido', leadTime: '–', target: '–', itens: 1, valorTotal: '–' },
  { id: 'PS: 0387261122', filial: 'BR06', urgencia: 'Low', wbs: 'BRRRRBBA32-MA...', tempoEspera: '0d 45m', status: 'Concluído', statusCor: 'demanda-cinza', bs: 'SP-BS 10983', criacao: '06/07/2026 12:21', finalizacao: 'não definido', leadTime: '–', target: '–', itens: 2, valorTotal: '–' },
];

const dadosTabela = [
  { id: 'PS:2306261114', solicitante: 'TESTE', wbs: 'WBS-PRJ-2024-001', status: 'Em Separação', bs: 'PE-BS 10976', criacaoBs: '23/06/2026 14:14', dataEntrega: 'não definido', contagem: '3d 00:11:45', contagemStatus: 'verde' },
  { id: 'PS:1106261734', solicitante: 'RASDAS', wbs: 'WBS-PRJ-2024-001', status: 'Concluído', bs: 'SP-BS 10975', criacaoBs: '11/06/2026 20:34', dataEntrega: '13/06/2026 10:00', contagem: 'Entregue', contagemStatus: 'neutro' },
  { id: 'PS:0707260938', solicitante: 'MARCIO', wbs: 'WBS-PRJ-2024-001', status: 'Em Atraso', bs: 'SP-BS 10977', criacaoBs: '07/07/2026 15:08', dataEntrega: 'não definido', contagem: '-0d 02:15:30', contagemStatus: 'vermelho' },
  { id: 'PS:1106261648', solicitante: 'DOUGLAS', wbs: 'WBS-PRJ-2024-001', status: 'Concluído', bs: 'SP-BS 10974', criacaoBs: '11/06/2026 19:48', dataEntrega: '16/06/2026 15:30', contagem: 'Entregue', contagemStatus: 'neutro' },
];

export default function Dashboard() {
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

      {/* --- CARDS SUPERIORES (KPIs) --- */}
      <div className="cards-grid">
        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Solicitações Recebidas</h3>
            <div className="icon-wrapper icon-blue"><ClipboardList size={20} /></div>
          </div>
          <p className="card-value value-blue">14</p>
          <p className="card-description">Total de PS no período</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">BS Emitidos</h3>
            <div className="icon-wrapper icon-blue"><FileCheck2 size={20} /></div>
          </div>
          <p className="card-value value-blue">12</p>
          <p className="card-description">Boletins criados</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Aguardando Aprovação</h3>
            <div className="icon-wrapper icon-orange"><Clock size={20} /></div>
          </div>
          <p className="card-value value-orange">0</p>
          <p className="card-description">Pendentes na fila</p>
        </div>

        <div className="stat-card">
          <div className="card-header">
            <h3 className="card-title">Em Separação</h3>
            <div className="icon-wrapper icon-blue"><Activity size={20} /></div>
          </div>
          <p className="card-value value-blue">1</p>
          <p className="card-description">Sendo processados agora</p>
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

        <p className="efficiency-footer">
          Nenhum BS concluído ainda para cálculo de eficiência.
        </p>
      </div>

      {/* ============================================================ */}
      {/* LINHA 1 DE GRÁFICOS (2 Colunas)                              */}
      {/* ============================================================ */}
      <div className="graficos-grid-2col">
        
        {/* GRÁFICO 1: Dentro vs Fora do Target */}
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
              <div key={mes} className="mes-box">
                <span>{mes}</span>
                <span style={{color: '#cbd5e1'}}>—</span>
              </div>
            ))}
          </div>

          <div className="grafico-area">
            <div className="grafico-eixo-y">
              <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
            </div>
            <div className="grafico-linhas">
              <div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div>
              <div className="linha-horizontal" style={{borderTopStyle: 'solid'}}></div>
            </div>
            <div className="grafico-eixo-x">
              <span>jan/26</span><span>fev/26</span><span>mar/26</span><span>abr/26</span><span>mai/26</span><span>jun/26</span>
            </div>
          </div>
          <div className="grafico-legenda">
            <div className="legenda-item"><div className="legenda-cor verde"></div> Dentro (%)</div>
            <div className="legenda-item"><div className="legenda-cor vermelha"></div> Fora (%)</div>
            <div className="legenda-item"><TrendingUp size={14} color="#eab308" /> Evolução (%)</div>
          </div>
        </div>

        {/* GRÁFICO 2: Acompanhamento de BS por Status */}
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
            <div className="status-box status-verde"><span>Finalizados</span><strong>0</strong></div>
            <div className="status-box status-vermelho"><span>Recusados</span><strong>1</strong></div>
            <div className="status-box status-azul"><span>Em Andamento</span><strong>11</strong></div>
          </div>

          <div className="grafico-area">
            <div className="grafico-eixo-y">
              <span>12</span><span>9</span><span>6</span><span>3</span><span>0</span>
            </div>
            <div className="grafico-linhas">
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal"></div><div className="linha-horizontal"></div>
              <div className="linha-horizontal" style={{borderTopStyle: 'solid'}}></div>
            </div>
            
            <div className="grafico-barras">
              <div className="barra-container">
                <span className="barra-label-topo" style={{opacity: 0}}>0</span>
                <div className="barra-preenchimento verde" style={{height: '0%'}}></div>
              </div>
              <div className="barra-container">
                <span className="barra-label-topo">1</span>
                <div className="barra-preenchimento vermelha" style={{height: '8.3%'}}></div>
              </div>
              <div className="barra-container">
                <span className="barra-label-topo">11</span>
                <div className="barra-preenchimento azul" style={{height: '91.6%'}}></div>
              </div>
            </div>

            <div className="grafico-eixo-x" style={{padding: '0 30px'}}>
              <span>Finalizados</span><span>Recusados</span><span>Em Andamento</span>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* LINHA 2 DE GRÁFICOS (Gráficos da Nova Imagem)                */}
      {/* ============================================================ */}
      <div className="graficos-linha-2">
        
        {/* GRÁFICO 3: TENDÊNCIA DE DEMANDAS DE PICKING (Barras Empilhadas) */}
        <div className="grafico-card" style={{ padding: '24px' }}>
          
          <div className="grafico-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Tendência de Demandas de Picking (Semanal)
            </h3>
            <button className="btn-mensal">Mensal</button>
          </div>

          <div className="grafico-legenda" style={{ marginTop: 0, marginBottom: '24px', justifyContent: 'center' }}>
             <div className="legenda-item"><div className="legenda-cor verde"></div> Dentro do Target</div>
             <div className="legenda-item"><div className="legenda-cor amarela"></div> Próximo</div>
             <div className="legenda-item"><div className="legenda-cor vermelha"></div> Em Atraso</div>
          </div>

          <div className="grafico-area">
             <div className="grafico-eixo-y">
               <span>25</span><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span>
             </div>
             
             <div className="grafico-linhas">
               <div className="linha-horizontal"></div>
               <div className="linha-horizontal"></div>
               <div className="linha-horizontal"></div>
               <div className="linha-horizontal"></div>
               <div className="linha-horizontal"></div>
               <div className="linha-horizontal" style={{ borderTopStyle: 'solid' }}></div>
             </div>
             
             <div className="grafico-barras">
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '95%' }}>
                      <div className="segmento vermelho" style={{ height: '5%' }}></div>
                      <div className="segmento amarelo" style={{ height: '15%' }}></div>
                      <div className="segmento verde" style={{ height: '80%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '76%' }}>
                      <div className="segmento amarelo" style={{ height: '5%' }}></div>
                      <div className="segmento verde" style={{ height: '95%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '68%' }}>
                      <div className="segmento vermelho" style={{ height: '10%' }}></div>
                      <div className="segmento amarelo" style={{ height: '20%' }}></div>
                      <div className="segmento verde" style={{ height: '70%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '68%' }}>
                      <div className="segmento vermelho" style={{ height: '15%' }}></div>
                      <div className="segmento amarelo" style={{ height: '25%' }}></div>
                      <div className="segmento verde" style={{ height: '60%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '80%' }}>
                      <div className="segmento vermelho" style={{ height: '25%' }}></div>
                      <div className="segmento amarelo" style={{ height: '15%' }}></div>
                      <div className="segmento verde" style={{ height: '60%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '48%' }}>
                      <div className="segmento vermelho" style={{ height: '40%' }}></div>
                      <div className="segmento amarelo" style={{ height: '20%' }}></div>
                      <div className="segmento verde" style={{ height: '40%' }}></div>
                   </div>
                </div>
                <div className="barra-container">
                   <div className="barra-segmentada" style={{ height: '28%' }}>
                      <div className="segmento vermelho" style={{ height: '30%' }}></div>
                      <div className="segmento verde" style={{ height: '70%' }}></div>
                   </div>
                </div>
             </div>
             
             <div className="grafico-eixo-x" style={{ padding: '0 20px' }}>
                <span>01/07</span><span>02/07</span><span>03/07</span><span>04/07</span><span>05/07</span><span>06/07</span><span>07/07</span>
             </div>
          </div>
        </div>

        {/* GRÁFICO 4: RESUMO POR FILIAL (DONUT CHARTS) */}
        <div className="grafico-card" style={{ padding: '24px' }}>
          
          <div className="grafico-header" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Resumo por Filial
            </h3>
          </div>
          
          <div className="filiais-grid">
            <div className="filial-mini-card">
              <h4>BR01</h4>
              <div className="donut-chart" style={{ background: 'conic-gradient(#10b981 0% 85%, #f59e0b 85% 100%)' }}>
                <div className="donut-inner">70%</div>
              </div>
              <span className="filial-volume">Volume: 13d</span>
              <div className="badge-critica alerta-verde">
                Ordem mais crítica <AlertTriangle size={10} color="#eab308" fill="#fefce8" />
              </div>
            </div>

            <div className="filial-mini-card">
              <h4>BR02</h4>
              <div className="donut-chart" style={{ background: 'conic-gradient(#10b981 0% 60%, #f59e0b 60% 90%, #ef4444 90% 100%)' }}>
                <div className="donut-inner">90%</div>
              </div>
              <span className="filial-volume">Volume: 10d</span>
              <div className="badge-critica alerta-amarelo">
                Ordem mais crítica <AlertTriangle size={10} color="#ca8a04" fill="#fefce8" />
              </div>
            </div>

            <div className="filial-mini-card">
              <h4>BR04</h4>
              <div className="donut-chart" style={{ background: 'conic-gradient(#10b981 0% 45%, #f59e0b 45% 85%, #ef4444 85% 100%)' }}>
                <div className="donut-inner">60%</div>
              </div>
              <span className="filial-volume">Volume: 30d</span>
              <div className="badge-critica alerta-amarelo">
                Ordem mais crítica <AlertTriangle size={10} color="#ca8a04" fill="#fefce8" />
              </div>
            </div>

            <div className="filial-mini-card">
              <h4>BR06</h4>
              <div className="donut-chart" style={{ background: 'conic-gradient(#3b82f6 0% 60%, #ef4444 60% 70%, #cbd5e1 70% 100%)' }}>
                <div className="donut-inner">60%</div>
              </div>
              <span className="filial-volume">Volume: 28d</span>
              <div className="badge-critica alerta-vermelho">
                Ordem mais crítica <AlertTriangle size={10} color="#dc2626" />
              </div>
            </div>
          </div>
        </div>

      </div>

{/* ============================================================ */}
      {/* LINHA 3: TABELA DE DEMANDAS DE PICKING                       */}
      {/* ============================================================ */}
      <div className="graficos-grid-1col" style={{ marginTop: '24px' }}>
         <TabelaDemandas dados={dadosTabela} />
      </div>

    </div>
  );
}