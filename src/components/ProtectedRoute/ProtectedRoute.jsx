import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx'; 

export default function ProtectedRoute({ allowedRoles }) {
  // 1. Retirámos o "role" daqui, porque ele não vem direto do useAuth
  const { usuario, loading } = useAuth();

  // Enquanto lê o LocalStorage, mostramos uma tela em branco ou loading
  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando acesso...</div>;

  // Se não estiver logado, chuta para a tela de login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 2. Extraímos o cargo corretamente de dentro do objeto do utilizador
  const role = usuario?.cargo;

  // Se a rota exige um cargo específico e o utilizador não o tem
  if (allowedRoles && !allowedRoles.includes(role)) {
    // 👇 Redirecionamos para o "painel" (que todos têm acesso) em vez do "dashboard"
    return <Navigate to="/logistica/painel" replace />;
  }

  // Se passou em tudo, liberta o acesso
  return <Outlet />;
}