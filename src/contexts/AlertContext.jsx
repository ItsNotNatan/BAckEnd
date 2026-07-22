import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Alerta.css';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerta, setAlerta] = useState(null);

  // Função mágica que vamos usar em toda a aplicação
  const mostrarAlerta = useCallback((mensagem, tipo = 'info') => {
    setAlerta({ mensagem, tipo });
    
    // O alerta desaparece sozinho após 4 segundos
    setTimeout(() => {
      setAlerta(null);
    }, 4000);
  }, []);

  const fecharAlerta = () => setAlerta(null);

  return (
    <AlertContext.Provider value={{ mostrarAlerta }}>
      {children}
      
      {/* Aqui a caixinha é desenhada no ecrã se houver um alerta */}
      {alerta && (
        <div className="alerta-global-overlay">
          <div className={`alerta-cartao alerta-${alerta.tipo}`}>
            
            <div className="alerta-icone">
              {alerta.tipo === 'sucesso' && <CheckCircle2 size={24} />}
              {alerta.tipo === 'erro' && <XCircle size={24} />}
              {alerta.tipo === 'aviso' && <AlertTriangle size={24} />}
              {alerta.tipo === 'info' && <Info size={24} />}
            </div>
            
            <div className="alerta-mensagem">{alerta.mensagem}</div>
            
            <button className="alerta-btn-fechar" onClick={fecharAlerta}>
              <X size={18} />
            </button>

          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

// Hook personalizado para usarmos facilmente
export const useAlert = () => useContext(AlertContext);