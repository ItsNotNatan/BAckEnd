import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quando a página carrega, verifica se o usuário já logou (salvo no navegador)
    const userSalvo = localStorage.getItem('nexus_user');
    if (userSalvo) {
      const parsed = JSON.parse(userSalvo);
      setUser(parsed);
      setRole(parsed.cargo);
    }
    setLoading(false);
  }, []);

  // Função para fazer o login manual e salvar no navegador
  const loginManual = (dadosUsuario) => {
    localStorage.setItem('nexus_user', JSON.stringify(dadosUsuario));
    setUser(dadosUsuario);
    setRole(dadosUsuario.cargo);
  };

  // Função para sair
  const logoutManual = () => {
    localStorage.removeItem('nexus_user');
    setUser(null);
    setRole(null);
  };

// ... resto do código acima

  return (
    <AuthContext.Provider value={{ user, role, loading, loginManual, logoutManual }}>
      {children}
    </AuthContext.Provider>
  );
};

// Adicione esta linha de comentário logo abaixo para silenciar o aviso do Vite:
/* eslint-disable-next-line react-refresh/only-export-components */

export const useAuth = () => useContext(AuthContext);