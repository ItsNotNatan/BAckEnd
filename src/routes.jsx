import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import CentralDeOperacoes from './pages/CentralOperacoes/CentralOperacoes';
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
import AcompanhamentoSolicitacoes from './pages/Cliente/AcompanhamentoSolicitacoes/AcompanhamentoSolicitacoes';

export const router = createBrowserRouter([
  { path: "/", element: <CentralDeOperacoes /> },
  { path: "/login", element: <LoginLogistica /> },

  // ==========================================
  // 🟢 ÁREA DO CLIENTE (AGORA PÚBLICA / LIVRE DE LOGIN)
  // ==========================================
  {
    path: "/cliente",
    element: <AppLayout modulo="cliente" />, 
    children: [
      { path: "consulta-estoque", element: <VisaoGeralEstoque perfil="cliente" /> },
      { path: "fazer-solicitacao", element: <FazerSolicitacao /> },
      { path: "acompanhamento-solicitacoes", element: <AcompanhamentoSolicitacoes perfil="cliente" /> },
      { path: "rastreabilidade", element: <Traceabilly perfil="cliente" /> }
    ]
  },

  // ==========================================
  // 🔴 ÁREA DA LOGÍSTICA (PROTEGIDA!)
  // ==========================================
  {
    path: "/logistica",
    // 🛡️ 1º Escudo: O utilizador TEM de ser da logística (Operador, Líder ou ADM)
    element: <ProtectedRoute allowedRoles={['OPERADOR', 'LIDER', 'ADM']} />,
    children: [
      {
        element: <AppLayout modulo="logistica" />,
        children: [

          // --- ROTAS NÍVEL 1 (Acesso de Operador, Líder e ADM) ---
          { path: "entrada-estoque", element: <EntradaEstoque /> },
          { path: "formatacao-sap", element: <FormatacaoSAP /> },
          { path: "traceabilly", element: <Traceabilly perfil="logistica" /> },
          { path: "painel", element: <AcompanhamentoSolicitacoes perfil="logistica" /> },
          { path: "visao-geral", element: <VisaoGeralEstoque /> },

          {
            // 🛡️ 2º Escudo: A partir daqui, Operador é barrado! Só Líder e ADM passam.
            element: <ProtectedRoute allowedRoles={['LIDER', 'ADM']} />,
            children: [
              { path: "dashboard", element: <Dashboard /> },
              { path: "PainelAprovacao", element: <PainelAprovacao /> },
              { path: "exportar", element: <ExportarDados /> },
              { path: "rota-coleta", element: <RotaColeta /> },

              {
                // 🛡️ 3º Escudo: A partir daqui, Líder é barrado! Só ADM entra.
                element: <ProtectedRoute allowedRoles={['ADM']} />,
                children: [
                  { path: "configuracoes", element: <Configuracoes /> }
                ]
              }
            ]
          }

        ]
      }
    ]
  }
]);