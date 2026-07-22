// FiltroEstoqueModal.jsx
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import './FiltroEstoqueModal.css';

const XCircle = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);
const X = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

// ✨ CONFIGURAÇÃO CENTRALIZADA: Adiciona ou remove campos do filtro aqui
const CAMPOS_FILTRO = [
  { chave: 'filial', label: 'Filial' },
  { chave: 'desenho_sap', label: 'Desenho SAP' },
  { chave: 'part_number', label: 'Part Number' },
  { chave: 'descricao', label: 'Descrição' },
  { chave: 'fornecedor', label: 'Fornecedor' },
  { chave: 'nf_entrada', label: 'NF Entrada' },
  { chave: 'quantidade_nf', label: 'Qtd. NF' },
  { chave: 'quantidade_disponivel', label: 'Saldo' },
  { chave: 'unidade_medida', label: 'Unidade de Medida (Un)' },
  { chave: 'valor_unitario', label: 'Valor Unitário' },
  { chave: 'alocacao', label: 'Alocação' },
  { chave: 'wbs', label: 'WBS' },
  { chave: 'situacao', label: 'Situação' }
];

export default function FiltroEstoqueModal({ 
  aberto, 
  onClose, 
  dadosEstoque, 
  filtros, 
  setFiltros,
  onLimpar
}) {
  
  // 🧠 Extrai opções de forma inteligente para TODAS as colunas configuradas
  const opcoesMapeadas = useMemo(() => {
    const mapaOpcoes = {};
    
    CAMPOS_FILTRO.forEach(({ chave }) => {
      // Cria um Set (valores únicos) extraindo o valor do campo
      // Removemos null, undefined, vazios e traços inúteis
      const valoresUnicos = new Set(
        dadosEstoque
          .map(item => item[chave])
          .filter(v => v !== null && v !== undefined && v !== '' && v !== '—' && v !== 'SEM-PN')
      );
      
      // Formata no padrão {value, label} exigido pelo react-select
      mapaOpcoes[chave] = Array.from(valoresUnicos).sort().map(val => ({
        value: val,
        label: String(val)
      }));
    });

    return mapaOpcoes;
  }, [dadosEstoque]);

  const temFiltroAtivo = Object.values(filtros).some(valor => valor !== null);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      borderRadius: '8px',
      padding: '0px',
      minHeight: '36px',
      fontSize: '0.875rem',
      '&:hover': { borderColor: '#94a3b8' }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#334155',
    })
  };

  if (!aberto) return null;

  return createPortal(
    <div className="filtro-modal__overlay">
      <div className="filtro-modal__content">
        
        <div className="filtro-modal__header">
          <div>
            <span className="filtro-modal__subtitle">Refine a sua listagem com precisão</span>
            <h2 className="filtro-modal__title">Filtros Avançados de Estoque</h2>
          </div>
          <button onClick={onClose} className="filtro-modal__close-btn">
            <X size={24} />
          </button>
        </div>

        {/* ✨ GERAÇÃO AUTOMÁTICA DOS CAMPOS COM BASE NO ARRAY */}
        <div className="filtro-modal__body">
          {CAMPOS_FILTRO.map((campo) => (
            <div className="filtro-block" key={campo.chave}>
              <label className="filtro-block__label">{campo.label}</label>
              <Select 
                options={opcoesMapeadas[campo.chave] || []}
                value={filtros[campo.chave] || null}
                onChange={(opt) => setFiltros({ ...filtros, [campo.chave]: opt })}
                placeholder={`Qualquer ${campo.label.toLowerCase()}...`}
                isClearable
                styles={selectStyles}
                noOptionsMessage={() => "Sem dados"}
              />
            </div>
          ))}
        </div>

        <div className="filtro-modal__footer">
          <div>
            {temFiltroAtivo && (
              <button onClick={onLimpar} className="filtro-modal__btn-clear">
                <XCircle size={16} /> Limpar Filtros
              </button>
            )}
          </div>
          <button onClick={onClose} className="filtro-modal__btn-submit">
            Aplicar e Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}