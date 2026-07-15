import React, { useState } from 'react';
import './EntradaEstoque.css';
import { 
  PackagePlus, 
  Search, 
  Filter, 
  Trash2,
  Package,
  FileSpreadsheet
} from 'lucide-react';

// IMPORTAÇÕES PARA O EXCEL FUNCIONAR
import CarregarArquivo from '../../../components/CarregarArquivo/CarregarArquivo';
import ModalProcessamento from '../../../components/ModalProcessamento/ModalProcessamento';
import { useProcessadorExcel } from '../../../hooks/useProcessadorExcel';
import ExemploExcel from '../../../components/ExemploExcel/ExemploExcel';

// DADOS SIMULADOS INICIAIS
const dadosEstoque = [
  {
    id: 1,
    desenho: '-',
    pn: 'PN-TUB-7890',
    descricao: 'Tubo Aço Inox 316L 6" S...',
    fornecedor: 'Aperam South America',
    nf: 'NF-45830',
    qtdEntrada: '-',
    saldoQtd: '4',
    saldoUnd: 'Metro',
    alocacao: '400-A-003',
    valorUnit: 'R$ 890.00',
    wbs: 'WBS-PRJ-2024-001',
    status: 'Disponível'
  }
];

export default function EntradaEstoque() {
  // 1. CRIAR ESTADO PARA A TABELA (Começa com o Mock Data, mas pode começar vazio: useState([]))
  const [itensEstoque, setItensEstoque] = useState(dadosEstoque);
  
  // 2. INICIAR O PROCESSADOR DE EXCEL
  const processador = useProcessadorExcel();

  // 3. FUNÇÃO PARA LER E FORMATAR O EXCEL
  const handleImportarExcel = async (arquivo) => {
    const novosItens = await processador.iniciarProcessamento(arquivo);
    
    if (novosItens && Array.isArray(novosItens)) {
      // Formatamos os dados que vêm do Utils para combinar com as colunas desta tabela
      const itensFormatados = novosItens.map((item, index) => ({
        id: `excel-${Date.now()}-${index}`,
        desenho: item.desenhoSAP || '-',
        pn: item.numPecaFabricante || '-',
        descricao: item.materialDescription || 'Sem descrição',
        fornecedor: item.fornecedor || '-',
        nf: item.docCompras || item.recebNF || '-', 
        qtdEntrada: item.qtdSelecionada || '-',
        saldoQtd: item.qtdSelecionada || '0',
        saldoUnd: item.unidadeMedida || 'Unid',
        alocacao: item.alocacao || '-',
        valorUnit: item.poNetPrice || 'R$ 0,00',
        wbs: item.wbs || '-',
        status: 'Disponível'
      }));

      // Adicionamos os novos itens à lista que já existe na tela
      setItensEstoque(prev => [...prev, ...itensFormatados]);
    }
  };

  // 4. FUNÇÃO PARA APAGAR ITEM DA TABELA
  const removerItem = (idParaRemover) => {
    setItensEstoque(prev => prev.filter(item => item.id !== idParaRemover));
  };

  return (
    <div className="estoque-wrapper">
      
      {/* TELA DE CARREGAMENTO DO EXCEL (MODAL) */}
      <ModalProcessamento 
        estaProcessando={processador.estaProcessando}
        concluido={processador.concluido}
        estadoProgresso={processador.estadoProgresso}
        resultado={processador.resultado}
        erroFatal={processador.erroFatal}
        onClose={processador.resetarProcessador}
      />

      {/* --- CABEÇALHO DA PÁGINA --- */}
      <header className="estoque-cabecalho">
        <h1>Entrada de Estoque</h1>
        <p>Cadastro detalhado de itens — Back-Office Logística</p>
      </header>

      {/* --- CARTÃO 1: FORMULÁRIO DE CADASTRO --- */}
      <div className="estoque-cartao form-cartao">
        
        {/* Título do Cartão */}
        <div className="cartao-titulo-grupo">
          <div className="icone-fundo-azul">
            <PackagePlus size={20} className="icone-azul" />
          </div>
          <h2>Cadastro de Item Manual</h2>
        </div>

        {/* Grelha do Formulário (CSS Grid) */}
        <div className="form-grid">
          {/* Linha 1 */}
          <div className="input-grupo">
            <label>Desenho SAP</label>
            <input type="text" placeholder="SAP-001" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>Part Number <span className="obrigatorio">*</span></label>
            <input type="text" placeholder="PN-12345" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>Descrição <span className="obrigatorio">*</span></label>
            <input type="text" placeholder="Descrição do item" className="input-campo" />
          </div>

          {/* Linha 2 */}
          <div className="input-grupo">
            <label>Fornecedor</label>
            <input type="text" placeholder="Nome do fornecedor" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>NF de Entrada</label>
            <input type="text" placeholder="NF-00001" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>Qtd. de Entrada pela NF</label>
            <input type="number" placeholder="0" className="input-campo" />
          </div>

          {/* Linha 3 */}
          <div className="input-grupo">
            <label>Alocação</label>
            <input type="text" placeholder="300-B-006" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>Valor Unitário (R$)</label>
            <input type="text" placeholder="0.00" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>WBS do Projeto <span className="obrigatorio">*</span></label>
            <input type="text" placeholder="WBS-2024-001" className="input-campo" />
          </div>

          {/* Linha 4 */}
          <div className="input-grupo">
            <label>Saldo Atual <span className="obrigatorio">*</span></label>
            <input type="number" placeholder="0" className="input-campo" />
          </div>
          <div className="input-grupo">
            <label>Unidade</label>
            <select className="input-campo select-campo">
              <option>Unid</option>
              <option>Metro</option>
              <option>Kg</option>
            </select>
          </div>
        </div>

        {/* Botão de Submissão alinhado à direita */}
        <div className="form-acoes">
          <button className="btn-primario">
            <PackagePlus size={18} />
            Cadastrar Item
          </button>
        </div>
      </div>

      {/* --- SECÇÃO 2: LISTAGEM E TABELA --- */}
      <div className="tabela-seccao">
        
        {/* Controlos de Pesquisa, Filtro e BOTÃO DE IMPORTAR EXCEL */}
        <div className="tabela-controlos">
          <div className="pesquisa-caixa">
            <Search size={18} className="icone-controlo" />
            <input type="text" placeholder="Buscar por Desenho SAP, PN, Descrição, WBS..." />
          </div>
          
          <div className="filtro-caixa">
            <Filter size={18} className="icone-controlo" />
            <input type="text" placeholder="Filtrar por Nota Fiscal..." />
          </div>
          <ExemploExcel />

          {/* AQUI ENTRA O COMPONENTE DE IMPORTAR EXCEL */}
          <CarregarArquivo 
            variante="botao"
            accept=".xlsx, .xls"
            label="Importar Excel SAP"
            icone={<FileSpreadsheet size={18} color="#10b981" />}
            onFileSelect={handleImportarExcel}
          />
        </div>

        {/* Tabela de Dados */}
        <div className="tabela-container">
          <table className="estoque-tabela">
            <thead>
              <tr>
                <th>DESENHO SAP</th>
                <th>PART NUMBER</th>
                <th>DESCRIÇÃO</th>
                <th>FORNECEDOR</th>
                <th>NF ENTRADA</th>
                <th>QTD. ENTRADA NF</th>
                <th>SALDO</th>
                <th>ALOCAÇÃO</th>
                <th>VALOR UNIT.</th>
                <th>WBS</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itensEstoque.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Nenhum item na entrada de estoque. Importe um Excel ou cadastre manualmente.
                  </td>
                </tr>
              ) : (
                itensEstoque.map((item) => (
                  <tr key={item.id}>
                    <td className="texto-cinza">{item.desenho}</td>
                    <td className="fonte-negrito">{item.pn}</td>
                    <td>{item.descricao}</td>
                    <td className="texto-cinza">{item.fornecedor}</td>
                    <td className="texto-cinza">{item.nf}</td>
                    <td className="texto-azul-claro font-bold">{item.qtdEntrada}</td>
                    
                    <td>
                      <div className="saldo-celula">
                        <strong>{item.saldoQtd}</strong>
                        <span>{item.saldoUnd}</span>
                      </div>
                    </td>
                    
                    <td><a href="#" className="link-azul">{item.alocacao}</a></td>
                    <td>{item.valorUnit}</td>
                    
                    <td className="wbs-celula">
                      <a href="#" className="link-azul">{item.wbs}</a>
                    </td>
                    
                    <td>
                      <span className="badge-disponivel">
                        <Package size={12} className="mr-1" />
                        {item.status}
                      </span>
                    </td>
                    
                    {/* Ação: Lixeira ATIVADA */}
                    <td className="acao-celula">
                      <button className="btn-icone" onClick={() => removerItem(item.id)}>
                        <Trash2 size={18} />
                      </button>
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