import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import CentralDeOperacoes from './pages/CentralOperacoes/CentralOperacoes';
import SelecionarFilial from './pages/SelecionarFilial/SelecionarFilial';
import LoginLogistica from './pages/LoginLogistica/LoginLogistica';

// --- PÁGINAS DA LOGÍSTICA ---
import Dashboard from './pages/Logistica/Dashboard/Dashboard'; 
import PainelAprovacao from './pages/Logistica/PainelAprovacao/PainelAprovacao';
import EntradaEstoque from './pages/Logistica/EntradaEstoque/EntradaEstoque';
import Traceabilly from './pages/Logistica/Traceabilly/Traceabilly';
import ExportarDados from './pages/Logistica/ExportarDados/ExportarDados';
import FormatacaoSAP from './pages/Logistica/FormatacaoSAP/FormatacaoSAP';
import Configuracoes from './pages/Logistica/Configuracoes/Configuracoes';
import RotaColeta from './pages/Logistica/RotaColeta/RotaColeta';
import VisaoGeralEstoque from './pages/Logistica/VisaoGeralEstoque/VisaoGeralEstoque';

// --- PÁGINAS DO CLIENTE ---
import FazerSolicitacao from './pages/Cliente/FazerSolicitacao/FazerSolicitacao';
import ConsultaEstoque from './pages/Cliente/ConsultaEstoque/ConsultaEstoque';
import AcompanhamentoSolicitacoes from './pages/Cliente/AcompanhamentoSolicitacoes/AcompanhamentoSolicitacoes';

export const router = createBrowserRouter([
  { path: "/", element: <CentralDeOperacoes /> },
  { path: "/selecionar-filial", element: <SelecionarFilial /> },
  { path: "/login", element: <LoginLogistica /> },
  
  // ==========================================
  // ÁREA DO CLIENTE
  // ==========================================
  {
    path: "/cliente",
    element: <AppLayout modulo="cliente" />, 
    children: [
      { path: "consulta-estoque", element: <ConsultaEstoque /> },
      { path: "fazer-solicitacao", element: <FazerSolicitacao /> },
      
      // 👇 COMPONENTE PARTILHADO (Versão Cliente)
      { path: "acompanhamento-solicitacoes", element: <AcompanhamentoSolicitacoes perfil="cliente" /> }
    ]
  },

  // ==========================================
  // ÁREA DA LOGÍSTICA (PROTEGIDA!)
  // ==========================================
  {
    path: "/logistica",
    // O ProtectedRoute garante que SÓ Operadores e ADMs passem daqui pra baixo
    element: <ProtectedRoute allowedRoles={['OPERADOR', 'ADM']} />, 
    children: [
      {
        element: <AppLayout modulo="logistica" />, 
        children: [
          
          // 👇 COMPONENTE PARTILHADO (Versão Logística)
          { path: "painel", element: <AcompanhamentoSolicitacoes perfil="logistica" /> },
          
          { path: "dashboard", element: <Dashboard /> },
          { path: "visao-geral", element: <VisaoGeralEstoque /> }, 
          { path: "PainelAprovacao", element: <PainelAprovacao /> },
          { path: "entrada-estoque", element: <EntradaEstoque /> },
          { path: "traceabilly", element: <Traceabilly /> },
          { path: "exportar", element: <ExportarDados /> },
          { path: "formatacao-sap", element: <FormatacaoSAP /> },
          { path: "rota-coleta", element: <RotaColeta /> },
          
          // Exemplo de rota ultra-restrita: Só ADM pode acessar as configurações
          { 
            element: <ProtectedRoute allowedRoles={['ADM']} />,
            children: [
              { path: "configuracoes", element: <Configuracoes /> }
            ]
          }
        ]
      }
    ]
  }
]);