import React, { useState } from 'react';
import './RotaColeta.css';
import { 
  Waypoints, Box, Search, Circle, CheckCircle2, ArrowRight, ListTree, 
  MapPin, Layers, CheckSquare, Printer, FileText 
} from 'lucide-react';

// DADOS MOCKADOS BASEADOS NA TUA IMAGEM
const bsMocks = [
  { id: '10991', solicitante: 'DOUGLAS', wbs: 'WBS BRBRRCY21-SPST003-BET-00', itens: 1, destino: 'BR06 - BETIM' },
  { id: '10990', solicitante: 'JEAN CESÁRIO', wbs: 'WBS BRBRRCY21-SPST003-BET-00', itens: 2, destino: 'TESTE' },
  { id: '10989', solicitante: 'DASDASD', wbs: 'WBS BRBRRCY21-SPST003-BET-00', itens: 1, destino: 'DASDASD' },
  { id: '10988', solicitante: 'MARCIO MAGELA', wbs: 'WBS BRBRRCY21-SPST003-BET-00', itens: 1, destino: 'TESTE' },
  { id: '10987', solicitante: 'JEFERSON', wbs: 'WBS BRBRRCY21-SPST003-BET-00', itens: 4, destino: 'BR02 - SANTO ANDRÉ' },
];

export default function RotaColeta() {
  const [pesquisa, setPesquisa] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  
  // NOVO ESTADO: Controla se a visualização da rota já foi gerada
  const [rotaGerada, setRotaGerada] = useState(false);

  // Filtragem
  const listaFiltrada = bsMocks.filter(bs => 
    bs.id.includes(pesquisa) || 
    bs.solicitante.toLowerCase().includes(pesquisa.toLowerCase()) ||
    bs.wbs.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // Lógica de Seleção: Ao alterar qualquer selecao, escondemos a rota para forçar recalcular
  const toggleSelecao = (id) => {
    setRotaGerada(false); // Esconde a rota anterior
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(item => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  const toggleSelecionarTodos = () => {
    setRotaGerada(false); // Esconde a rota anterior
    if (selecionados.length === listaFiltrada.length && listaFiltrada.length > 0) {
      setSelecionados([]);
    } else {
      setSelecionados(listaFiltrada.map(bs => bs.id));
    }
  };

  const handleGerarRota = () => {
    // Na vida real, farias fetch do backend com os IDs selecionados e ordenarias por alocação
    setRotaGerada(true);
  };

  const isTodosSelecionados = selecionados.length === listaFiltrada.length && listaFiltrada.length > 0;
  const existemSelecionados = selecionados.length > 0;

  return (
    <div className="rota-coleta-wrapper">
      
      <header className="rota-cabecalho">
        <Waypoints className="icone-titulo" size={36} strokeWidth={2.5} />
        <div>
          <h1>Rota de Coleta (Picking)</h1>
          <p>Selecione múltiplos BS para consolidar os materiais e gerar uma rota de separação ordenada pela posição no estoque.</p>
        </div>
      </header>

      <div className="rota-grid">
        
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: LISTA DE BS                             */}
        {/* ======================================================== */}
        <div className="painel-selecao">
          
          <div className="banner-info-azul">
            <Box size={16} /> Exibindo apenas BS ativos (Em Separação)
          </div>

          <div className="pesquisa-bs-wrapper">
            <Search className="pesquisa-icone" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nº BS, WBS, solicitante..." 
              className="pesquisa-input"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          <div className="selecionar-todos-bar">
            <div className="checkbox-personalizado" onClick={toggleSelecionarTodos}>
              {isTodosSelecionados ? (
                <CheckCircle2 size={20} color="#2563eb" fill="#eff6ff" />
              ) : (
                <Circle size={20} color="#94a3b8" />
              )}
              <span>Selecionar todos</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>
              {selecionados.length} selecionado(s)
            </span>
          </div>

          <div className="lista-bs-scroll">
            {listaFiltrada.map((bs) => {
              const isChecked = selecionados.includes(bs.id);
              return (
                <div key={bs.id} className={`item-bs-coleta ${isChecked ? 'selecionado' : ''}`} onClick={() => toggleSelecao(bs.id)}>
                  <div style={{ marginTop: '2px' }}>
                    {isChecked ? (
                      <CheckCircle2 size={20} color="#2563eb" fill="#eff6ff" />
                    ) : (
                      <Circle size={20} color="#cbd5e1" />
                    )}
                  </div>
                  <div className="item-bs-info">
                    <div className="item-bs-titulo">
                      <strong>BS</strong> #{bs.id}
                    </div>
                    <div className="item-bs-detalhes">
                      {bs.solicitante} &middot; {bs.wbs} &middot; {bs.itens} {bs.itens === 1 ? 'item' : 'itens'}
                    </div>
                    <div className="item-bs-destino">
                      <ArrowRight size={12} /> {bs.destino}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="painel-selecao-footer">
            <button 
              className={`btn-gerar-rota ${existemSelecionados ? 'ativo' : ''}`}
              disabled={!existemSelecionados}
              onClick={handleGerarRota}
            >
              <ListTree size={18} /> Gerar Rota de Coleta
            </button>
          </div>
          
        </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: RENDER CONDICIONAL (PREVIEW VS GERADO)   */}
        {/* ======================================================== */}
        
        {!rotaGerada ? (
          /* ESTADO VAZIO ANTES DE CLICAR NO BOTÃO */
          <div className="painel-preview">
            <Waypoints size={64} className="icone-preview-rota" strokeWidth={1.5} />
            <h3>Selecione um ou mais BS e clique em "Gerar Rota de Coleta"</h3>
            <p>A rota será ordenada pela posição física no estoque</p>
          </div>
        ) : (
          /* ESTADO PREENCHIDO (ROTA GERADA) */
          <div className="painel-rota-gerada">
            
            {/* 1. KPIs Superiores */}
            <div className="rota-kpis-grid">
              <div className="rota-kpi-item">
                <div className="kpi-icone-bg azul"><MapPin size={18} /></div>
                <div className="kpi-textos"><strong>1</strong><span>Paradas</span></div>
              </div>
              <div className="rota-kpi-item">
                <div className="kpi-icone-bg azul"><Layers size={18} /></div>
                <div className="kpi-textos"><strong>{selecionados.length}</strong><span>BS</span></div>
              </div>
              <div className="rota-kpi-item">
                <div className="kpi-icone-bg azul"><Box size={18} /></div>
                <div className="kpi-textos"><strong>15</strong><span>Qtd Total</span></div>
              </div>
              <div className="rota-kpi-item">
                <div className="kpi-icone-bg verde"><CheckSquare size={18} /></div>
                <div className="kpi-textos"><strong>1</strong><span>NFs</span></div>
              </div>
            </div>

            {/* 2. Cabeçalho Impressão */}
            <div className="rota-header-imprimir">
              <div>
                <h2>Rota Otimizada de Separação</h2>
                <p>Ordenada por posição no estoque &middot; BS #{selecionados.join(', ')}</p>
              </div>
              <button className="btn-imprimir">
                <Printer size={16} /> Imprimir / PDF
              </button>
            </div>

            {/* 3. Lista de Paradas */}
            <div className="rota-paradas-scroll">
              
              {/* CARD DE UMA PARADA (Mockado conforme a imagem) */}
              <div className="parada-cartao">
                
                <div className="parada-header">
                  <div className="parada-header-esq">
                    <span className="badge-parada-num">PARADA 01</span>
                    <span className="badge-parada-loc"><MapPin size={14}/> 200-E-006-0044</span>
                  </div>
                  <div className="parada-total-geral">
                    Total Geral: <strong>15</strong>
                  </div>
                </div>

                <div className="parada-body">
                  
                  {/* Bloco de uma NF dentro da parada */}
                  <div className="nf-linha-header">
                    <div className="badge-nf-tit">
                      <FileText size={16}/> NÚMERO DA NF: <span className="badge-nf-num">396340</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>Qtd NF: <strong>15</strong></span>
                  </div>

                  {/* Item a recolher */}
                  <div className="item-linha-detalhe">
                    <Circle size={20} color="#cbd5e1" style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>WBS</span>
                    <span className="badge-wbs-item">BRBRRCY21-SPST003-BET-00</span>
                    
                    <div className="item-desc-textos">
                      <strong>TLXXX-0000021870</strong>
                      <span>MODULO DE RELE PLC RSC 24UC 21 21</span>
                      <span>PN: 2967073</span>
                    </div>
                    
                    <div className="item-qtd-destaque">
                      <strong>15</strong><span>NR</span>
                    </div>
                  </div>

                  <div className="linha-subtotal">
                    Subtotal NF 396340: <strong>15</strong>
                  </div>

                </div>

                <div className="linha-total-final">
                  TOTAL GERAL DA PARADA: <strong>15</strong>
                </div>

              </div>
              
              {/* Se tivesses mais locais/paradas, farias um .map() aqui a criar mais cartões "parada-cartao" */}
              
            </div>

          </div>
        )}

      </div>
    </div>
  );
}