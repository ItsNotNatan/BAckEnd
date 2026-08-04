import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FazerSolicitacao.css';

// 1. Importamos TODOS os ícones de uma vez só (sem repetições!)
import { 
  Boxes, 
  ArrowLeftRight, 
  FileText, 
  PackagePlus, 
  Truck, 
  RefreshCcw, 
  XCircle, 
  ArrowLeft,
  Send, 
  Package, 
  AlertTriangle, 
  Search 
} from 'lucide-react';

// 2. Importação do Botão Global
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

// IMPORTAÇÃO DOS COMPONENTES FILHOS
import MaterialEstoque from './MaterialEstoque'; 
import TransferenciaWBS from '../TransferenciaWBS/TransferenciaWBS';
import SolicitarNotaFiscal from '../SolicitarNotaFiscal/SolicitarNotaFiscal';
import EntradaMaterial from '../EntradaMaterial/EntradaMaterial';
import Crossdocking from '../Crossdocking/Crossdocking';
import ReintegracaoItens from '../ReintegracaoItens/ReintegracaoItens';
import CancelarBS from '../CancelarBS/CancelarBS';

export default function FazerSolicitacao() {
  const [tipoAtivo, setTipoAtivo] = useState('material');
  
  // 3. Inicializamos o useNavigate
  const navigate = useNavigate();

const tiposSolicitacao = [
    // Deixamos o Material sem cor para usar o Azul padrão
    { id: 'material', titulo: 'Material de Estoque', desc: 'Retirada de itens do almoxarifado', icone: <Boxes size={20} /> },
    { id: 'transferencia', titulo: 'Transferência de WBS', desc: 'Mover material para outro projeto', icone: <ArrowLeftRight size={20} />, cor: 'amarelo' },
    { id: 'nf', titulo: 'Solicitar Nota Fiscal', desc: 'Emissão de nota fiscal', icone: <FileText size={20} />, cor: 'roxo' },
    { id: 'entrada', titulo: 'Entrada de Material', desc: 'Solicitar entrada no estoque', icone: <PackagePlus size={20} />, cor: 'verde' },
    { id: 'crossdocking', titulo: 'Crossdocking', desc: 'Saída via nota fiscal', icone: <Truck size={20} />, cor: 'ciano' },
    { id: 'reintegracao', titulo: 'Reintegração de Itens', desc: 'Devolver material ao estoque', icone: <RefreshCcw size={20} />, cor: 'laranja' },
    { id: 'cancelar', titulo: 'Cancelar BS', desc: 'Cancelar boletim emitido', icone: <XCircle size={20} />, cor: 'vermelho' }
  ];

  return (
    <div className="solicitacao-wrapper">
      
      {/* CABEÇALHO COM BOTÃO VOLTAR */}
      <header className="solicitacao-cabecalho">
        <div className="cabecalho-topo">
          {/* O navigate(-1) diz ao navegador para voltar à página anterior */}
          <div>
            <h1>Fazer Solicitação</h1>
            <p>Escolha o tipo de solicitação que deseja realizar</p>
          </div>
        </div>
      </header>

      {/* MENU DE BOTÕES COM CORES DINÂMICAS */}
      <div className="tipos-container">
        {tiposSolicitacao.map((tipo) => {
          let classeCartao = 'tipo-cartao';
          
          if (tipoAtivo === tipo.id) {
            classeCartao += tipo.cor ? ` ativo-${tipo.cor}` : ' ativo';
          }

          return (
            <div 
              key={tipo.id} 
              className={classeCartao}
              onClick={() => setTipoAtivo(tipo.id)}
            >
              <div className="tipo-icone">{tipo.icone}</div>
              <div className="tipo-titulo">{tipo.titulo}</div>
              <div className="tipo-desc">{tipo.desc}</div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* RENDERIZAÇÃO CONDICIONAL DOS MÓDULOS                      */}
      {/* ========================================================= */}
      <div className="conteudo-dinamico">
        {tipoAtivo === 'material' && <MaterialEstoque />}
        {tipoAtivo === 'transferencia' && <TransferenciaWBS />}
        {tipoAtivo === 'nf' && <SolicitarNotaFiscal />}
        {tipoAtivo === 'entrada' && <EntradaMaterial />}
        {tipoAtivo === 'crossdocking' && <Crossdocking />}
        {tipoAtivo === 'reintegracao' && <ReintegracaoItens />}
        {tipoAtivo === 'cancelar' && <CancelarBS />}
      </div>

    </div>
  );
}