import React from 'react';
import './ExportarDados.css';
import { Download, FileText, Activity, BarChart3, CheckCircle2 } from 'lucide-react';

// 👇 IMPORTAMOS O NOVO COMPONENTE
import TabelaDemandas from '../../../components/TabelaDemandas/TabelaDemandas';

const abasNav = [
  { id: 'ps-bs', label: 'PS + BS (Solicitações)', icone: <FileText size={16} />, ativo: true },
  { id: 'evolucao', label: 'Evolução Histórica', icone: <Activity size={16} />, ativo: false },
  { id: 'volume', label: 'Volume Diário', icone: <BarChart3 size={16} />, ativo: false },
  { id: 'status', label: 'Status dos BS', icone: <CheckCircle2 size={16} />, ativo: false },
];

const kpis = [
  { titulo: 'Total de PS', valor: '14', estilo: 'padrao' },
  { titulo: 'Concluídos', valor: '2', estilo: 'sucesso' },
  { titulo: 'Cancelados', valor: '2', estilo: 'alerta' },
  { titulo: 'Em Separação', valor: '1', estilo: 'info' },
];

const dadosTabela = [
  { id: 'PS:2306261114', solicitante: 'TESTE', wbs: 'WBS-PRJ-2024-001', status: 'Em Separação', bs: 'PE-BS 10976', criacaoBs: '23/06/2026 14:14', dataEntrega: 'não definido', contagem: '3d 00:11:45', contagemStatus: 'verde' },
  { id: 'PS:1106261734', solicitante: 'RASDAS', wbs: 'WBS-PRJ-2024-001', status: 'Concluído', bs: 'SP-BS 10975', criacaoBs: '11/06/2026 20:34', dataEntrega: '13/06/2026 10:00', contagem: 'Entregue', contagemStatus: 'neutro' },
  { id: 'PS:0707260938', solicitante: 'MARCIO', wbs: 'WBS-PRJ-2024-001', status: 'Em Atraso', bs: 'SP-BS 10977', criacaoBs: '07/07/2026 15:08', dataEntrega: 'não definido', contagem: '-0d 02:15:30', contagemStatus: 'vermelho' },
  { id: 'PS:1106261648', solicitante: 'DOUGLAS', wbs: 'WBS-PRJ-2024-001', status: 'Concluído', bs: 'SP-BS 10974', criacaoBs: '11/06/2026 19:48', dataEntrega: '16/06/2026 15:30', contagem: 'Entregue', contagemStatus: 'neutro' },
];

export default function ExportarDados() {
  return (
    <div className="exportar-wrapper">
      
      <header className="exportar-cabecalho">
        <div>
          <h1>Exportar Dados</h1>
          <p>Exporte os dados das solicitações e dos gráficos do Dashboard</p>
        </div>
        <button className="btn-exportar">
          <Download size={18} /> Exportar (14) .CSV
        </button>
      </header>

      <div className="abas-container">
        {abasNav.map((aba) => (
          <button key={aba.id} className={`aba-item ${aba.ativo ? 'ativo' : ''}`}>
            {aba.icone} {aba.label}
          </button>
        ))}
      </div>

      <div className="kpis-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className={`kpi-card ${kpi.estilo}`}>
            <span className="kpi-titulo">{kpi.titulo}</span>
            <span className="kpi-valor">{kpi.valor}</span>
          </div>
        ))}
      </div>

      {/* 👇 CHAMAMOS O COMPONENTE E PASSAMOS OS DADOS AQUI! */}
      <TabelaDemandas dados={dadosTabela} />

    </div>
  );
}