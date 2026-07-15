import React from 'react';
import './BotaoAcaoGlobal.css';

export default function BotaoAcaoGlobal({ texto, icone, onClick, cor, carregando }) {
  return (
    <div className="form-acoes-final mt-4">
      <button 
        className={`btn-enviar-global btn-${cor}`} 
        onClick={onClick}
        disabled={carregando}
        type="button"
      >
        {icone}
        {carregando ? 'Processando...' : texto}
      </button>
    </div>
  );
}