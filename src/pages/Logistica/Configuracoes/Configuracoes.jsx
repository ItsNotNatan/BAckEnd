import React, { useState } from 'react';
import './Configuracoes.css';
// 👇 A CORREÇÃO ESTÁ AQUI: Adicionamos o RotateCcw e o Save na importação
import { Target, Info, RotateCcw, Save } from 'lucide-react';

export default function Configuracoes() {
  // Estado para armazenar o valor do input (começa com 3)
  const [prazo, setPrazo] = useState(3);

  return (
    <div className="config-wrapper">
      
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <header className="config-cabecalho">
        <h1>Configurações</h1>
        <p>Edite as métricas usadas no Dashboard</p>
      </header>

      {/* --- CARTÃO DE CONFIGURAÇÃO --- */}
      <div className="config-cartao">
        
        {/* Cabeçalho do Cartão */}
        <div className="cartao-topo">
          <div className="icone-destaque">
            <Target size={24} className="icone-azul" />
          </div>
          <div className="textos-topo">
            <h2>Target de Eficiência</h2>
            <p>Usado no KPI "Dentro do Target" do Dashboard</p>
          </div>
        </div>

        <hr className="divisor" />

        {/* Formulário (Input) */}
        <div className="form-grupo">
          <label htmlFor="prazo-input">PRAZO TARGET (EM DIAS)</label>
          <input 
            id="prazo-input"
            type="number" 
            className="input-padrao" 
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
          
          <p className="texto-ajuda">
            Um BS é considerado "Dentro do Target" se o tempo entre a <strong>criação da PS</strong> e a <strong>data de finalização do BS</strong> for &le; {prazo || 0} dia(s).
          </p>
        </div>

        {/* --- CAIXA INFORMATIVA --- */}
        <div className="caixa-info">
          <div className="info-titulo">
            <Info size={18} />
            <span>Como é calculado?</span>
          </div>
          
          <ul className="info-lista">
            <li>Lead Time = Data Finalização BS &minus; Data Criação da Solicitação PS</li>
            <li>Se Lead Time &le; Target &rarr; conta como "Dentro do Target"</li>
            <li>Se Lead Time &gt; Target &rarr; conta como "Fora do Target"</li>
            <li>Eficiência % = (Dentro / Total) &times; 100</li>
            <li>Apenas BS com status "Concluído" entram no cálculo</li>
          </ul>
        </div>

        {/* ========================================= */}
        {/* BARRA DE AÇÕES (RODAPÉ)                   */}
        {/* ========================================= */}
        <div className="config-rodape-acoes">
          <span className="rodape-texto">
            Configurações salvas localmente neste navegador.
          </span>
          
          <div className="rodape-botoes">
            <button className="btn-padrao">
              <RotateCcw size={16} /> Padrão
            </button>
            
            <button className="btn-salvar">
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}