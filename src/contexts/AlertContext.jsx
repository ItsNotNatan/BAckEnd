import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './AlertContext.css';

// --- Ícones Simples ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState(null);

  // Fecha o alerta
  const fechar = useCallback(() => {
    setAlertConfig(null);
  }, []);

  // Chama um alerta normal (Apenas um botão OK)
  const showAlert = useCallback((title, message, type = 'info') => {
    setAlertConfig({
      isConfirm: false,
      title,
      message,
      type,
      onConfirm: fechar
    });
  }, [fechar]);

  // Chama um alerta de confirmação (Retorna uma Promise, ótimo para await!)
  const showConfirm = useCallback((title, message, type = 'warning', confirmText = 'Confirmar') => {
    return new Promise((resolve) => {
      setAlertConfig({
        isConfirm: true,
        title,
        message,
        type,
        confirmText,
        onConfirm: () => {
          fechar();
          resolve(true); // O usuário clicou no botão principal
        },
        onCancel: () => {
          fechar();
          resolve(false); // O usuário clicou em cancelar
        }
      });
    });
  }, [fechar]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Renderiza o Portal na tela se houver alguma config ativa */}
      {alertConfig && createPortal(
        <div className="alert-overlay">
          <div className="alert-card">
            
            <div className="alert-header">
              <div className={`alert-icon alert-icon--${alertConfig.type}`}>
                {alertConfig.type === 'success' && <CheckIcon />}
                {alertConfig.type === 'warning' && <AlertIcon />}
                {alertConfig.type === 'error' && <ErrorIcon />}
                {alertConfig.type === 'info' && <InfoIcon />}
              </div>
              <h3 className="alert-title">{alertConfig.title}</h3>
            </div>
            
            <div className="alert-body">
              <p>{alertConfig.message}</p>
            </div>

            <div className="alert-footer">
              {alertConfig.isConfirm && (
                <button className="alert-btn alert-btn--cancel" onClick={alertConfig.onCancel}>
                  Cancelar
                </button>
              )}
              <button 
                className={`alert-btn ${alertConfig.type === 'error' ? 'alert-btn--error' : 'alert-btn--confirm'}`} 
                onClick={alertConfig.onConfirm}
              >
                {alertConfig.isConfirm ? alertConfig.confirmText : 'OK'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);