// =================================================================
// ARQUIVO: src/contexts/AuthContext.jsx
// DESCRIÇÃO: Gestão global do estado de autenticação e filial ativa
// =================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

// 🐛 CORREÇÃO 1: Adicionado o "export" para que os outros componentes consigam importar o contexto sem quebrar a app.
export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  
  // 🐛 CORREÇÃO 2: Renomeámos para "estoqueAtual" para bater certo com o Header e as restantes Páginas.
  const [estoqueAtual, setEstoqueAtual] = useState('');
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  // 1. RESTAURA A SESSÃO AO CARREGAR A PÁGINA
  useEffect(() => {
    const tokenSalvo = localStorage.getItem('@NexusLog:token');
    const usuarioSalvo = localStorage.getItem('@NexusLog:usuario');
    const filialSalva = localStorage.getItem('@NexusLog:filialAtiva');

    if (tokenSalvo && usuarioSalvo) {
      try {
        // Verifica se o valor não é a string 'undefined' antes de fazer o parse
        if (usuarioSalvo !== 'undefined') {
          const usuarioObj = JSON.parse(usuarioSalvo);
          setToken(tokenSalvo);
          setUsuario(usuarioObj);
          setEstoqueAtual(filialSalva || usuarioObj.filial || '');
        }
      } catch (e) {
        console.warn("Sessão corrompida, a limpar dados.");
        localStorage.removeItem('@NexusLog:usuario');
        localStorage.removeItem('@NexusLog:token');
      }
    }

    setCarregandoInicial(false);
  }, []);

  // 2. FUNÇÃO DE LOGIN
  const login = async (dadosUsuario, tokenRecebido) => {
    setUsuario(dadosUsuario);
    setToken(tokenRecebido);

    const filialInicial = dadosUsuario.filial || (dadosUsuario.filiais_acesso && dadosUsuario.filiais_acesso[0]) || '';
    setEstoqueAtual(filialInicial);

    localStorage.setItem('@NexusLog:token', tokenRecebido);
    localStorage.setItem('@NexusLog:usuario', JSON.stringify(dadosUsuario));
    localStorage.setItem('@NexusLog:filialAtiva', filialInicial);
  };

  // 3. FUNÇÃO DE LOGOUT
  const logout = () => {
    setUsuario(null);
    setToken(null);
    setEstoqueAtual('');

    localStorage.removeItem('@NexusLog:token');
    localStorage.removeItem('@NexusLog:usuario');
    localStorage.removeItem('@NexusLog:filialAtiva');
  };

  // 4. TROCAR FILIAL ATIVA (Guarda no estado e no navegador)
  const MudarFilial = (novaFilialId) => {
    setEstoqueAtual(novaFilialId);
    localStorage.setItem('@NexusLog:filialAtiva', novaFilialId);
  };

  // 🐛 CORREÇÃO 3: Agora fornecemos os nomes exatos que os teus componentes estão à espera.
  return (
    <AuthContext.Provider value={{
      signed: !!usuario,
      usuario,
      token,
      estoqueAtual,                  // Disponibiliza o nome correto para as páginas
      setEstoqueAtual: MudarFilial,  // Aponta para a função que atualiza o State E o LocalStorage!
      login,
      logout,
      carregandoInicial
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);