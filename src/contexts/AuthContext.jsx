import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quando o app carrega, verifica se já tem alguém logado (salvo no LocalStorage)
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('@NexusLog:usuario');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setLoading(false);
  }, []);

  // Função para salvar o usuário ao fazer login
  const login = (dadosUsuario) => {
    setUsuario(dadosUsuario);
    localStorage.setItem('@NexusLog:usuario', JSON.stringify(dadosUsuario));
  };

  // Função para sair do sistema
  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('@NexusLog:usuario');
  };

  return (
    // Exportamos o "role" direto do cargo do usuário para facilitar o ProtectedRoute
    <AuthContext.Provider value={{ usuario, role: usuario?.cargo, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usarmos facilmente em qualquer tela
export const useAuth = () => useContext(AuthContext);