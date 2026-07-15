// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx'; // <-- Importe o hook de autenticação

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useAuth();

  // Enquanto o Supabase pensa, mostramos uma tela em branco ou loading
  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando acesso...</div>;

  // Se não estiver logado, chuta para a tela de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige um cargo específico e o usuário não tem, chuta para o dashboard (ou painel geral)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/logistica/dashboard" replace />;
  }

  // Se passou em tudo, libera a catraca (renderiza a página que ele queria ver)
  return <Outlet />;
}