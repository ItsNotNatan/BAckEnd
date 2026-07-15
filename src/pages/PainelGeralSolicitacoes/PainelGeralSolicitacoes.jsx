import React, { useState } from 'react';
import './PainelGeralSolicitacoes.css';
import { 
  Search, 
  ChevronRight, 
  GitBranch, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Edit2
} from 'lucide-react';

// DADOS MOCKADOS BASEADOS NA IMAGEM
const dadosTabela = [
  {
    id: '2306261114',
    tipo: 'Material',
    solicitante: 'TESTE',
    wbs: 'WBS-PRJ-2024-001',
    bs: 'BS #PE-BS 10976',
    dataCriacao: '23/06/26 14:14',
    dataFinalizacao: null,
    status: 'Em Separação'
  },
  {
    id: '1106261734',
    tipo: 'Material',
    solicitante: 'RASDAS',
    wbs: 'WBS-PRJ-2024-001',
    bs: 'BS #SP-BS 10975',
    dataCriacao: '11/06/26 20:34',
    dataFinalizacao: '15/06/26 07:59',
    status: 'Concluído'
  },
  {
    id: '1106261648',
    tipo: 'Material',
    solicitante: 'DOUGLAS',
    wbs: 'WBS-PRJ-2024-001',
    bs: 'BS #SP-BS 10974',
    dataCriacao: '11/06/26 19:48',
    dataFinalizacao: '11/06/26 16:51',
    status: 'Concluído'
  },
  {
    id: '1006261107',
    tipo: 'Material',
    solicitante: 'SADFSDAS',
    wbs: 'WBS-PRJ-2024-001',
    bs: null,
    dataCriacao: '10/06/26 14:07',
    dataFinalizacao: null,
    status: 'Cancelado'
  }
];

const filtrosArray = ['Todos', 'Material', 'Transfer. WBS', 'Nota Fiscal', 'Entrada', 'Crossdocking', 'Reintegração'];

const renderBadgeStatus = (status) => {
  switch (status) {
    case 'Em Separação':
      return (
        <span className="badge-status status-separacao">
          <RefreshCw size={14} /> Em Separação
        </span>
      );
    case 'Concluído':
      return (
        <span className="badge-status status-concluido">
          <CheckCircle2 size={14} /> Concluído
        </span>
      );
    case 'Cancelado':
      return (
        <span className="badge-status status-cancelado">
          <XCircle size={14} /> Cancelado
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export default function PainelGeralSolicitacoes() {
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');

  return (
    <div className="painel-geral-wrapper">
      
      <header className="painel-cabecalho">
        <h1>Painel Geral de Solicitações</h1>
        <p>Gerencie todas as solicitações — materiais, WBS, NFs, entradas, crossdocking e reintegrações</p>
      </header>

      {/* CARTÕES DE RESUMO SUPERIORES (KPIs) */}
      <div className="kpis-linha-5">
        <div className="kpi-card-resumo kpi-total">
          <span>Total</span>
          <strong>14</strong>
        </div>
        <div className="kpi-card-resumo kpi-pendentes">
          <span>Pendentes</span>
          <strong>0</strong>
        </div>
        <div className="kpi-card-resumo kpi-andamento">
          <span>Em Andamento</span>
          <strong>1</strong>
        </div>
        <div className="kpi-card-resumo kpi-concluidos">
          <span>Concluídos</span>
          <strong>10</strong>
        </div>
        <div className="kpi-card-resumo kpi-recusados">
          <span>Recusados</span>
          <strong>3</strong>
        </div>
      </div>

      {/* ÁREA DA TABELA */}
      <div className="tabela-cartao-container">
        
        <div className="tabela-controlos-topo">
          <div className="filtros-botoes">
            {filtrosArray.map((filtro) => (
              <button 
                key={filtro}
                className={`btn-aba ${filtroAtivo === filtro ? 'ativo' : ''}`}
                onClick={() => setFiltroAtivo(filtro)}
              >
                {filtro}
              </button>
            ))}
          </div>
          
          <div className="controlos-direita">
            <select className="select-periodo">
              <option>Todo Período</option>
              <option>Este Mês</option>
              <option>Hoje</option>
            </select>
            <div className="pesquisa-wrapper-direita">
              <Search className="icone-pesquisa-dir" size={16} />
              <input type="text" placeholder="Buscar solicitações..." />
            </div>
          </div>
        </div>

        <div className="tabela-scroll-horizontal">
          <table className="tabela-solicitacoes">
            <thead>
              <tr>
                <th className="col-chevron"></th>
                <th>TIPO</th>
                <th>ID / SOLICITANTE / WBS</th>
                <th>Nº DO BS</th>
                <th>DATA CRIAÇÃO</th>
                <th>DATA/HORA FINALIZ.</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {dadosTabela.map((linha, index) => (
                <tr key={index}>
                  
                  <td className="col-chevron">
                    <ChevronRight size={18} />
                  </td>

                  <td>
                    <span className="badge-tipo">
                      <GitBranch size={14} /> {linha.tipo}
                    </span>
                  </td>

                  <td>
                    <div className="bloco-id-multiplo">
                      <span className="texto-ps-id">PS : {linha.id}</span>
                      <span className="nome-solicitante">{linha.solicitante}</span>
                      <a href="#" className="link-wbs">{linha.wbs}</a>
                    </div>
                  </td>

                  <td>
                    {linha.bs ? (
                      <span className="badge-bs">
                        <FileText size={14} /> {linha.bs}
                      </span>
                    ) : (
                      <span className="traco-vazio">—</span>
                    )}
                  </td>

                  <td className="texto-data">{linha.dataCriacao}</td>

                  <td>
                    {linha.dataFinalizacao !== null ? (
                      <div className="bloco-finalizacao">
                        <span className="texto-data-verde">{linha.dataFinalizacao}</span>
                        <button className="btn-editar-data"><Edit2 size={12}/> Editar</button>
                      </div>
                    ) : (
                      linha.status !== 'Cancelado' ? (
                        <div className="bloco-finalizacao">
                          <span className="texto-data-amarelo">não definido</span>
                          <button className="btn-editar-data"><Edit2 size={12}/> Editar</button>
                        </div>
                      ) : (
                        <span className="traco-vazio">—</span>
                      )
                    )}
                  </td>

                  <td>
                    {renderBadgeStatus(linha.status)}
                  </td>

                  <td>
                    <select className="select-acao" defaultValue={linha.status}>
                      <option value="Em Separação">Em Separação</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}