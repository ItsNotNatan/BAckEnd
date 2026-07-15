import React, { useState } from 'react';
import './ConsultaEstoque.css';
import {
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  FileSpreadsheet
} from 'lucide-react';

// Importamos a nossa ferramenta e o componente de botão
import CarregarArquivo from '../../../components/CarregarArquivo/CarregarArquivo';
import { lerRelatorioSAP } from '../../../utils/excelUtils';

// Mantemos o mock inicial apenas para quando a página carrega vazia
const dadosIniciais = [];

export default function ConsultaEstoque() {
  const [periodoAtivo, setPeriodoAtivo] = useState('Total');
  const [dadosTabela, setDadosTabela] = useState(dadosIniciais); // Estado que guarda os itens
  const [carregando, setCarregando] = useState(false);

  // Calcula os valores dinâmicos dos KPIs baseado no Excel importado
  const totalItens = dadosTabela.length;
  const disponiveis = dadosTabela.filter(item => item.status === 'Disponível').length;
  const zerados = dadosTabela.filter(item => item.status === 'Zerado').length;

  const handleImportarSAP = async (arquivo) => {
    setCarregando(true);
    try {
      const novosDados = await lerRelatorioSAP(arquivo);
      setDadosTabela(novosDados);
    } catch (erro) {
      alert(erro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="consulta-wrapper">

      {/* --- CABEÇALHO --- */}
      <header className="consulta-cabecalho" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Consulta de Estoque</h1>
          <p>Visão completa dos materiais disponíveis em todos os projetos</p>
        </div>
        
        {/* NOSSO BOTÃO DE UPLOAD AQUI! */}
        <CarregarArquivo 
          variante="botao"
          accept=".xlsx, .xls, .csv"
          label={carregando ? "Carregando..." : "Importar Relatório SAP"}
          icone={<FileSpreadsheet size={16} color="#10b981" />}
          onFileSelect={handleImportarSAP}
        />
      </header>

      {/* --- DESTAQUE: VALOR TOTAL --- */}
      <div className="cartao-valor-total">
        <div className="valor-info-grupo">
          <div className="icone-cifrao">
            <DollarSign size={24} strokeWidth={2.5} />
          </div>
          <div className="valor-textos">
            <label>VALOR TOTAL DO ESTOQUE</label>
            <h2>R$ --,--</h2> {/* Na vida real, farias um .reduce() para somar os valores da tabela */}
          </div>
        </div>

        <div className="itens-ativos-badge">
          <span>Itens Ativos</span>
          <strong>{disponiveis}</strong>
        </div>
      </div>

      {/* --- FILTROS DE PERÍODO --- */}
      <div className="filtros-periodo">
        <span>PERÍODO:</span>
        {['Total', 'Hoje', 'Semana', 'Mês'].map(periodo => (
          <button
            key={periodo}
            className={`btn-periodo ${periodoAtivo === periodo ? 'ativo' : ''}`}
            onClick={() => setPeriodoAtivo(periodo)}
          >
            {periodo}
          </button>
        ))}
      </div>

      {/* --- CARTÕES KPI (Dinâmicos agora!) --- */}
      <div className="kpis-estoque">
        <div className="kpi-card selecionado">
          <div className="kpi-icone">
            <Package size={20} />
          </div>
          <div className="kpi-textos">
            <label>Total de Linhas (SAP)</label>
            <strong>{totalItens}</strong>
          </div>
        </div>

        <div className="kpi-card verde">
          <div className="kpi-icone">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-textos">
            <label>Com Saldo</label>
            <strong>{disponiveis}</strong>
          </div>
        </div>

        <div className="kpi-card vermelho">
          <div className="kpi-icone">
            <XCircle size={20} />
          </div>
          <div className="kpi-textos">
            <label>Zerados</label>
            <strong>{zerados}</strong>
          </div>
        </div>
      </div>

      {/* --- ÁREA DA TABELA --- */}
      <div className="tabela-area">
        <div className="tabela-pesquisas">
          <div className="pesquisa-grupo principal">
            <Search className="icone-busca" size={18} />
            <input type="text" placeholder="Buscar por Desenho SAP, Part Number, Descrição, WBS..." />
          </div>
          <div className="pesquisa-grupo secundaria">
            <FileText className="icone-busca" size={18} />
            <input type="text" placeholder="Buscar por Nota Fiscal..." />
          </div>
        </div>

        <div className="resultados-info">
          {totalItens} resultados encontrados
        </div>

        <div className="scroll-tabela">
          <table className="tabela-dados">
            <thead>
              <tr>
                <th>DESENHO SAP</th>
                <th>MATERIAL DESCRIPTION</th>
                <th>Nº PEÇA FABRICANTE</th>
                <th>FORNECEDOR</th>
                <th>QTD. FORNECIDA</th>
                <th>REFERÊNCIA</th>
                <th>UNIDADE</th>
                <th>VENDOR DESCRIPTION</th>
                <th>WBS</th>
                <th>EMISSÃO NF</th>
                <th>RECEB. NF</th>
                <th>DOC. DE COMPRAS</th>
                <th>PO NET PRICE</th>
                <th>CENTRO</th>
                <th>DEPÓSITO</th>
                <th>ALOCAÇÃO</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dadosTabela.length === 0 ? (
                <tr>
                  <td colSpan="17" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <FileSpreadsheet size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <br />
                    Importe o relatório SAP no botão acima para visualizar o estoque.
                  </td>
                </tr>
              ) : (
                dadosTabela.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.desenhoSAP !== '-' ? (
                        <span className="texto-cinza-claro" style={{ display: 'block', maxWidth: '100px', wordWrap: 'break-word' }}>
                          {item.desenhoSAP}
                        </span>
                      ) : (
                        <span className="texto-cinza-claro">-</span>
                      )}
                    </td>
                    <td className="texto-preto" style={{ minWidth: '200px' }}>{item.materialDescription}</td>
                    <td><span className="badge-partnumber">{item.numPecaFabricante}</span></td>
                    <td className="texto-cinza-escuro">{item.fornecedor}</td>
                    <td>
                      <div className={`qtd-celula ${item.qtdFornecida === '0' ? 'vermelho' : 'verde'}`}>
                        {item.qtdFornecida}
                      </div>
                    </td>
                    <td className="texto-cinza-escuro">{item.referencia}</td>
                    <td className="texto-cinza">{item.unidadeMedida}</td>
                    <td className="texto-cinza-claro" style={{ minWidth: '180px' }}>{item.vendorDescription}</td>
                    <td><a href="#" className="link-azul">{item.wbs}</a></td>
                    <td className="texto-cinza">{item.emissaoNF}</td>
                    <td className="texto-cinza">{item.recebNF}</td>
                    <td className="texto-cinza-escuro">{item.docCompras}</td>
                    <td className="texto-preto">{item.poNetPrice}</td>
                    <td className="texto-cinza">{item.centro}</td>
                    <td className="texto-cinza">{item.deposito}</td>
                    <td><a href="#" className="link-azul">{item.alocacao}</a></td>
                    <td>
                      {item.status === 'Zerado' ? (
                        <span className="badge-status-tabela status-zerado">
                          <XCircle size={14} /> {item.status}
                        </span>
                      ) : (
                        <span className="badge-status-tabela status-disponivel">
                          <CheckCircle2 size={14} /> {item.status}
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