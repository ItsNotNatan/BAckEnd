import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
  LayoutDashboard, ListTodo, PackagePlus, Archive, Download, FileSpreadsheet, Settings, Hexagon,
  ClipboardEdit, Boxes, FileClock, Waypoints, ClipboardList, Home, Lock // ⬅️ Lock adicionado aqui!
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ modulo }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { usuario, estoqueAtual } = useAuth();
  const role = usuario?.cargo; 

  const menuCliente = [
    { path: '/cliente/consulta-estoque', label: 'Consulta de Estoque', icon: <Boxes size={20} /> },
    { path: '/cliente/fazer-solicitacao', label: 'Fazer Solicitação', icon: <ClipboardEdit size={20} /> },
    { path: '/cliente/acompanhamento-solicitacoes', label: 'Acompanhamento', icon: <FileClock size={20} /> },
    { path: '/cliente/rastreabilidade', label: 'Rastreabilidade', icon: <Archive size={20} /> },
  ];

  const menuLogistica = [
    { path: '/logistica/entrada-estoque', label: 'Entrada de Estoque', icon: <PackagePlus size={20} />, roles: ['ADM', 'LIDER', 'OPERADOR'] },
    { path: '/logistica/formatacao-sap', label: 'Formatação SAP', icon: <FileSpreadsheet size={20} />, roles: ['ADM', 'LIDER', 'OPERADOR'] },
    { path: '/logistica/traceabilly', label: 'Rastreabilidade', icon: <Archive size={20} />, roles: ['ADM', 'LIDER', 'OPERADOR'] },
    { path: '/logistica/painel', label: 'Painel Geral', icon: <ClipboardList size={20} />, roles: ['ADM', 'LIDER', 'OPERADOR'] },
    { path: '/logistica/visao-geral', label: 'Visão Geral do Estoque', icon: <Boxes size={20} />, roles: ['ADM', 'LIDER', 'OPERADOR'] },
    { path: '/logistica/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADM', 'LIDER'] },
    { path: '/logistica/PainelAprovacao', label: 'Painel de Aprovação', icon: <ListTodo size={20} />, roles: ['ADM', 'LIDER'] },
    { path: '/logistica/exportar', label: 'Exportar Dados (PS)', icon: <Download size={20} />, roles: ['ADM', 'LIDER'] },
    { path: '/logistica/rota-coleta', label: 'Rota de Coleta', icon: <Waypoints size={20} />, roles: ['ADM', 'LIDER'] },
    { path: '/logistica/configuracoes', label: 'Configurações', icon: <Settings size={20} />, roles: ['ADM'] },
  ];

  let menuItems = [];

  if (modulo === 'cliente') {
    if (estoqueAtual === 'TODOS') {
      menuItems = menuCliente.map(item => {
        if (item.path !== '/cliente/consulta-estoque') {
          return { ...item, isDisabled: true };
        }
        return item; 
      });
    } else {
      menuItems = menuCliente; 
    }
  } else {
    const menuLogisticaFiltrado = menuLogistica.filter(item => item.roles.includes(role));
    menuItems = menuLogisticaFiltrado;
  }

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
            <li key={item.path} title={item.isDisabled ? "Selecione uma filial específica no topo para acessar" : ""}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-item ${isActive && !item.isDisabled ? "ativo" : ""} ${item.isDisabled ? "desabilitado" : ""}`
                }
                onClick={(e) => {
                  if (item.isDisabled) {
                    e.preventDefault(); 
                  }
                }}
              >
                <div className="nav-item-content">
                  <span className="nav-icone">{item.icon}</span>
                  <span className="nav-texto">{item.label}</span>
                </div>
                {/* ✨ REGRA DO CADEADO: Se estiver desabilitado, desenha o cadeado */}
                {item.isDisabled && (
                  <Lock size={16} className="icone-cadeado" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn-voltar-sidebar"
          onClick={() => navigate('/')}
        >
          <Home size={18} />
          Página Inicial
        </button>
      </div>
    </aside>
  );
}