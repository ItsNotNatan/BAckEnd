import React from 'react';
import './ModalProcessamento.css';
import { FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ModalProcessamento({ 
  estaProcessando, 
  concluido, 
  estadoProgresso, 
  resultado, 
  erroFatal,
  onClose 
}) {
  
  if (!estaProcessando && !concluido && !erroFatal) return null;

  return (
    <div className="modal-overlay-processamento">
      <div className="modal-processamento-cartao">
        
        {/* CABEÇALHO */}
        <div className="modal-header-proc">
          {concluido ? (
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
          ) : erroFatal ? (
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          ) : (
            <FileSpreadsheet size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
          )}
          
          <h3>{concluido ? 'Processamento Concluído' : erroFatal ? 'Erro no Processamento' : 'Importando Dados'}</h3>
          {!concluido && !erroFatal && <p className="fase-texto">{estadoProgresso.fase}</p>}
        </div>

        {/* BARRA DE PROGRESSO ANIMADA */}
        {!concluido && !erroFatal && (
          <div>
            <div className="barra-fundo">
              <div 
                className="barra-preenchimento" 
                style={{ width: `${estadoProgresso.progresso}%` }}
              ></div>
            </div>
            <span className="percentagem-texto">{estadoProgresso.progresso}%</span>
          </div>
        )}

        {/* ERRO FATAL */}
        {erroFatal && (
          <div className="resumo-processamento" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
            <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{erroFatal}</p>
          </div>
        )}

        {/* RELATÓRIO PÓS-PROCESSAMENTO */}
        {concluido && resultado && (
          <div className="resumo-processamento">
            <div className="linha-resumo">
              <span>Linhas lidas:</span>
              <strong>{resultado.estatisticas.totalLido}</strong>
            </div>
            <div className="linha-resumo sucesso">
              <span>Itens importados com sucesso:</span>
              <strong>{resultado.estatisticas.sucesso}</strong>
            </div>
            <div className="linha-resumo aviso">
              <span>Linhas em branco ignoradas:</span>
              <strong>{resultado.estatisticas.ignorados}</strong>
            </div>
            <div className="linha-resumo erro">
              <span>Falhas ou erros:</span>
              <strong>{resultado.estatisticas.errosLista.length}</strong>
            </div>
          </div>
        )}

        {/* BOTÃO DE AÇÃO */}
        {(concluido || erroFatal) && (
          <button className="btn-fechar-modal" onClick={onClose}>
            {concluido ? 'Visualizar Tabela' : 'Fechar e Tentar Novamente'}
          </button>
        )}

      </div>
    </div>
  );
}