import React from 'react';
import { Paperclip, X } from 'lucide-react';
import CarregarArquivo from '../CarregarArquivo/CarregarArquivo';

export default function GerenciadorAnexos({ anexos, setAnexos, titulo = "ANEXOS (OPCIONAL)" }) {
  
  const handleAnexar = (arquivo) => {
    // Adiciona o novo ficheiro à lista existente
    setAnexos([...anexos, arquivo]);
  };

  const removerAnexo = (indexRemover) => {
    // Remove o ficheiro em que clicámos no 'X'
    setAnexos(anexos.filter((_, index) => index !== indexRemover));
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          {titulo}
        </span>
      </div>

      <CarregarArquivo 
        variante="botao"
        accept=".pdf, .jpg, .jpeg, .png, .xlsx, .csv"
        label="Adicionar Arquivo"
        icone={<Paperclip size={16} />}
        onFileSelect={handleAnexar}
      />

      {/* Lista de Ficheiros Selecionados */}
      {anexos.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {anexos.map((arquivo, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', 
                border: '1px solid #e2e8f0', width: 'fit-content', minWidth: '300px', maxWidth: '100%' 
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {arquivo.name}
              </span>
              <button 
                onClick={() => removerAnexo(index)} 
                type="button"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '12px' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}