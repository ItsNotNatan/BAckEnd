import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
  LayoutDashboard, ListTodo, PackagePlus, Archive, Download, FileSpreadsheet, Settings, Hexagon,
  ClipboardEdit, Boxes, FileClock, ArrowLeft, Waypoints, ClipboardList
} from 'lucide-react';

export default function Sidebar({ modulo }) {
  // Ferramentas de navegação para o botão de voltar
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Menu EXCLUSIVO do Cliente
  const menuCliente = [
    { path: '/cliente/consulta-estoque', label: 'Consulta de Estoque', icon: <Boxes size={20} /> },
    { path: '/cliente/fazer-solicitacao', label: 'Fazer Solicitação', icon: <ClipboardEdit size={20} /> },
    { path: '/cliente/acompanhamento-solicitacoes', label: 'Acompanhamento', icon: <FileClock size={20} /> },
    // 👇 NOVA ROTA ADICIONADA AQUI
    { path: '/cliente/rastreabilidade', label: 'Rastreabilidade', icon: <Archive size={20} /> },
  ];

  // 2. Menu EXCLUSIVO da Logística
  const menuLogistica = [
    { path: '/logistica/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/logistica/visao-geral', label: 'Visão Geral do Estoque', icon: <Boxes size={20} /> },
    { path: '/logistica/entrada-estoque', label: 'Entrada de Estoque', icon: <PackagePlus size={20} /> },
    { path: '/logistica/PainelAprovacao', label: 'Painel de Aprovação', icon: <ListTodo size={20} /> },
    { path: '/logistica/painel', label: 'Painel Geral', icon: <ClipboardList size={20} /> },
    { path: '/logistica/traceabilly', label: 'Rastreabilidade', icon: <Archive size={20} /> },
    { path: '/logistica/exportar', label: 'Exportar Dados (PS)', icon: <Download size={20} /> },
    { path: '/logistica/formatacao-sap', label: 'Formatação SAP', icon: <FileSpreadsheet size={20} /> },
    { path: '/logistica/rota-coleta', label: 'Rota de Coleta', icon: <Waypoints size={20} /> },
    { path: '/logistica/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  const menuItems = modulo === 'cliente' ? menuCliente : menuLogistica;
  const tituloSidebar = modulo === 'cliente' ? 'Portal do Cliente' : 'NexusLog';

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo">
        <div className="logo-icone">
          <Hexagon size={24} />
        </div>
        <h2>{tituloSidebar}</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? "nav-item ativo" : "nav-item"}
              >
                <span className="nav-icone">{item.icon}</span>
                <span className="nav-texto">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Secção inferior com o botão de voltar */}
      <div className="sidebar-footer">
        <button
          className="btn-voltar-sidebar"
          // Vai para os galpões, e guarda a página atual na memória para voltar para cá depois!
          onClick={() => navigate('/selecionar-filial', { state: { destinoFinal: location.pathname } })}
        >
          <ArrowLeft size={18} />
          Voltar a Galpões
        </button>
      </div>

    </aside>
  );
}