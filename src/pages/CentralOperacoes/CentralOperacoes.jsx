import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import './CentralOperacoes.css';
import { Box, LayoutGrid, ClipboardList, ShieldCheck, Activity, ArrowRight } from 'lucide-react';

export default function CentralDeOperacoes() {
  const navigate = useNavigate();

  return (
    <div className="painel-container">
      <header className="cabecalho">
        <h1 className="cabecalho-titulo">
            Central de Operações <br />
            <span className="destaque-azul">COMAU Logistics</span>
        </h1>
        <p className="cabecalho-subtitulo">
            Controle de estoque, solicitações, aprovações e rastreabilidade em tempo real.
        </p>
      </header>

      <main className="grelha-principal">
        {/* Cartão 1: Portal do Cliente */}
        <div className="cartao">
            <div className="icone-destaque-azul"><Box size={24} /></div>
            <h2 className="cartao-titulo">Portal do Cliente</h2>
            <p className="cartao-descricao">Consulte estoque, faça solicitações e acompanhe seus pedidos por filial.</p>
            <div className="area-tags">
                <span className="tag">Estoque</span><span className="tag">Solicitações</span><span className="tag">Rastreabilidade</span>
            </div>
            {/* Vai para a filial, mas avisa que o destino final é a rota do cliente */}
            <button 
                className="botao-acao" 
                onClick={() => navigate('/selecionar-filial', { state: { destinoFinal: '/cliente/consulta-estoque' } })}
            >
                Selecionar Filial <ArrowRight size={18} className="icone-seta" />
            </button>
        </div>

        {/* Cartão 2: Área da Logística */}
        <div className="cartao">
            <div className="icone-destaque-azul"><LayoutGrid size={24} /></div>
            <h2 className="cartao-titulo">Área da Logística</h2>
            <p className="cartao-descricao">Dashboard operacional, aprovações de BS, painel geral e controle de estoque.</p>
            <div className="area-tags">
                <span className="tag">Dashboard</span><span className="tag">Aprovação de BS</span><span className="tag">Painel Geral</span>
            </div>
            {/* Vai para a filial, mas avisa que o destino final é a rota da logística */}
            <button 
                className="botao-acao"
                onClick={() => navigate('/selecionar-filial', { state: { destinoFinal: '/logistica/painel' } })}
            >
                Acessar Logística <ArrowRight size={18} className="icone-seta" />
            </button>
        </div>
      </main>

      {/* ... a secção de atalhos em baixo e rodapé mantém-se igual, omiti para não poluir ... */}
    </div>
  );
}