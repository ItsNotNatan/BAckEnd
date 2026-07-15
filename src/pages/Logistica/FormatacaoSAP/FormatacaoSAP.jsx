import React, { useState } from 'react';
import './FormatacaoSAP.css';
import { FileSpreadsheet, Search } from 'lucide-react';

// DADOS MOCKADOS (Atualizados para corresponder à tua imagem)
const dadosLista = [
  {
    id: '10976',
    solicitante: 'TESTE',
    itens: 4,
    data: '23/06/26',
    destino: 'STELLANTIS GOIANA'
  },
  {
    id: '10975',
    solicitante: 'RASDAS',
    itens: 2,
    data: '11/06/26',
    destino: 'DSADSAD'
  },
  {
    id: '10974',
    solicitante: 'DOUGLAS',
    itens: 1,
    data: '11/06/26',
    destino: 'COMAU BETIM'
  },
  {
    id: '10973',
    solicitante: 'MARCIO',
    itens: 1,
    data: '10/06/26',
    destino: 'TESTE'
  },
  {
    id: '10972',
    solicitante: 'JEFERSON GARANDY',
    itens: 3,
    data: '10/06/26',
    destino: 'MANUFACTURING'
  },
  {
    id: '10971',
    solicitante: 'DOUGLAS FELIPE',
    itens: 1,
    data: '10/06/26',
    destino: '...'
  }
];

export default function FormatacaoSAP() {
  const [abaAtiva, setAbaAtiva] = useState('bs');

  return (
    <div className="formatacao-wrapper">
      
      {/* --- CABEÇALHO --- */}
      <header className="formatacao-cabecalho">
        <FileSpreadsheet className="icone-titulo" size={32} />
        <div>
          <h1>Formatação para SAP</h1>
          <p>Selecione um BS ou PS, preencha a Categoria e copie as linhas formatadas para colar no SAP.</p>
        </div>
      </header>

      {/* --- LAYOUT DIVIDIDO EM DUAS COLUNAS --- */}
      <div className="formatacao-grid">
        
        {/* COLUNA ESQUERDA: LISTA DE BUSCA */}
        <div className="cartao-lista">
          
          <div className="toggle-container">
            <button 
              className={`toggle-btn ${abaAtiva === 'bs' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('bs')}
            >
              Boletins de Saída (BS)
            </button>
            <button 
              className={`toggle-btn ${abaAtiva === 'ps' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('ps')}
            >
              Solicitações (PS)
            </button>
          </div>

          <div className="pesquisa-container">
            <div className="pesquisa-input-wrapper">
              <Search className="pesquisa-icone" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nº BS, WBS..." 
                className="pesquisa-input"
              />
            </div>
          </div>

          <div className="lista-scroll-container">
            {dadosLista.map((item) => (
              <div key={item.id} className="lista-item">
                <div className="item-titulo">
                  <strong>BS</strong> #{item.id}
                </div>
                <div className="item-meta">
                  {item.solicitante} &middot; {item.itens} {item.itens === 1 ? 'item' : 'itens'} &middot; {item.data}
                </div>
                {item.destino && (
                  <div className="item-destino">
                    &rarr; {item.destino}
                  </div>
                )}
              </div>
            ))}
          </div>
          
        </div>

        {/* COLUNA DIREITA: ESTADO VAZIO (PREVIEW) */}
        <div className="cartao-preview">
          <FileSpreadsheet size={56} className="icone-preview" strokeWidth={1.5} />
          <h3>Selecione um BS ou PS à esquerda</h3>
          <p>Os dados serão formatados no padrão SAP</p>
        </div>

      </div>

    </div>
  );
}