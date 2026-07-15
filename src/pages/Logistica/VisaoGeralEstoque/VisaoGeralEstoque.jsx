import React, { useState } from 'react';
import './VisaoGeralEstoque.css';
import { DollarSign, Search, CheckCircle2, XCircle } from 'lucide-react';

// DADOS MOCKADOS BASEADOS NA TUA IMAGEM
const mockEstoque = [
  { sap: 'TLXXX-0000030944', pn: 'BLW-ES', desc: 'BLOQUEADOR PARA VÁLVULA DE ESFERA', fornecedor: 'SINALIZAÇÃO', nf: '7446', qtdNf: 54, saldo: 54, un: 'NR', valorUnit: 'R$ 136,13', alocacao: '200-E-006-0054', wbs: 'BRBRRBA32-MAT-000-WP001', status: 'Disponível' },
  { sap: 'TMC000000009467', pn: '19 30 006 0446', desc: 'BASE PARA TOMADA HC 2 PEGS M25', fornecedor: 'HARTING', nf: 'AR-8927', qtdNf: 2, saldo: 2, un: 'NR', valorUnit: 'R$ 215,56', alocacao: '002-B-004', wbs: 'BRBCBBB29-GAA-000-MTE01', status: 'Disponível' },
  { sap: 'TLXXX-0000002345', pn: '09 16 024 3101', desc: 'INSERTO FEMEA 24POLOS PE', fornecedor: 'HARTING', nf: 'AR-8927', qtdNf: 1, saldo: 1, un: 'NR', valorUnit: 'R$ 236,62', alocacao: '002-B-004', wbs: 'BRBCBBB29-GAA-000-MTE01', status: 'Disponível' },
  { sap: 'T09 15 000 6202', pn: '09 15 000 6202', desc: 'CONTATO CRIMP FEMEA', fornecedor: 'HARTING', nf: 'AR-8927', qtdNf: 30, saldo: 30, un: 'NR', valorUnit: 'R$ 8,90', alocacao: '002-B-004', wbs: 'BRBCBBB29-GAA-000-MTE01', status: 'Disponível' },
  // Linha extra simulando um item zerado para testar o filtro
  { sap: 'TLXXX-0000099999', pn: 'PN-ZERO', desc: 'MATERIAL TESTE ZERADO', fornecedor: 'TESTE', nf: '1234', qtdNf: 10, saldo: 0, un: 'NR', valorUnit: 'R$ 50,00', alocacao: '001-A-001', wbs: 'WBS-TESTE', status: 'Zerado' }
];

export default function VisaoGeralEstoque() {
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Lógica de Filtragem
  const dadosFiltrados = mockEstoque.filter((item) => {
    // 1. Filtro de Status
    let passaStatus = true;
    if (filtroStatus === 'Disponíveis') passaStatus = item.status === 'Disponível';
    if (filtroStatus === 'Zerados') passaStatus = item.status === 'Zerado';

    // 2. Filtro de Pesquisa (SAP, PN, Descrição, WBS)
    const termo = pesquisa.toLowerCase();
    const passaPesquisa = 
      item.sap.toLowerCase().includes(termo) ||
      item.pn.toLowerCase().includes(termo) ||
      item.desc.toLowerCase().includes(termo) ||
      item.wbs.toLowerCase().includes(termo);

    return passaStatus && passaPesquisa;
  });

  // KPIs
  const totalItens = mockEstoque.length;
  const disponiveis = mockEstoque.filter(i => i.status === 'Disponível').length;
  const zerados = mockEstoque.filter(i => i.status === 'Zerado').length;

  return (
    <div className="visao-geral-wrapper">
      
      {/* CABEÇALHO */}
      <header className="visao-cabecalho">
        <h1>Visão Geral do Estoque</h1>
        <p>Edição manual completa de todos os materiais — perfil Logística</p>
      </header>

      {/* CARTÃO RESUMO (VALORES E KPIs) */}
      <div className="cartao-resumo-estoque">
        <div className="bloco-valor-total">
          <div className="icone-cifrao-bg">
            <DollarSign size={24} strokeWidth={2.5} />
          </div>
          <div className="textos-valor">
            <label>VALOR TOTAL DO ESTOQUE</label>
            <h2>R$ 456.467,25</h2>
          </div>
        </div>

        <div className="mini-kpis-grupo">
          <div className="mini-kpi-card kpi-preto">
            <span>Total de Itens</span>
            <strong>{totalItens}</strong>
          </div>
          <div className="mini-kpi-card kpi-verde">
            <span>Disponíveis</span>
            <strong>{disponiveis}</strong>
          </div>
          <div className="mini-kpi-card kpi-vermelho">
            <span>Zerados</span>
            <strong>{zerados}</strong>
          </div>
        </div>
      </div>

      {/* TABELA E CONTROLES */}
      <div className="cartao-tabela">
        
        {/* Controles: Abas e Pesquisa */}
        <div className="tabela-controles">
          <div className="filtros-abas">
            {['Todos', 'Disponíveis', 'Zerados'].map(aba => (
              <button 
                key={aba}
                className={`btn-aba-estoque ${filtroStatus === aba ? 'ativo' : ''}`}
                onClick={() => setFiltroStatus(aba)}
              >
                {aba}
              </button>
            ))}
          </div>

          <div className="pesquisa-wrapper">
            <Search className="icone-pesquisa" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {/* Total de Resultados da Busca */}
        <div className="tabela-info-resultados">
          {dadosFiltrados.length} resultado(s)
        </div>

        {/* Tabela Scrollável */}
        <div className="tabela-scroll">
          <table className="dados-table">
            <thead>
              <tr>
                <th>DESENHO SAP</th>
                <th>PART NUMBER</th>
                <th>DESCRIÇÃO</th>
                <th>FORNECEDOR</th>
                <th>NF ENTRADA</th>
                <th>QTD. NF</th>
                <th>SALDO</th>
                <th>UN</th>
                <th>VALOR UNIT.</th>
                <th>ALOCAÇÃO</th>
                <th>WBS</th>
                <th>SITUAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Nenhum material encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, index) => (
                  <tr key={index}>
                    <td className="fonte-mono">{item.sap}</td>
                    <td className="fonte-mono">{item.pn}</td>
                    <td style={{ minWidth: '220px' }}>{item.desc}</td>
                    <td>{item.fornecedor}</td>
                    <td>{item.nf}</td>
                    <td>{item.qtdNf}</td>
                    <td className={item.saldo > 0 ? 'texto-verde-destaque' : 'texto-vermelho-destaque'}>
                      {item.saldo}
                    </td>
                    <td>{item.un}</td>
                    <td>{item.valorUnit}</td>
                    <td className="fonte-mono">{item.alocacao}</td>
                    <td className="fonte-mono">{item.wbs}</td>
                    <td>
                      {item.status === 'Disponível' ? (
                        <span className="badge-status-tabela status-disponivel">
                          <CheckCircle2 size={12} /> Disp...
                        </span>
                      ) : (
                        <span className="badge-status-tabela status-zerado">
                          <XCircle size={12} /> Zerado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}