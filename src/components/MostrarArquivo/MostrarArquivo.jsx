import React from 'react';
import { 
  FileText, FileImage, FileSpreadsheet, File, Download, Paperclip, Trash2 // 👈 Adiciona Trash2 aqui
} from 'lucide-react';
import './MostrarArquivo.css';

// --- FUNÇÃO AUXILIAR: Retorna o ícone e a cor com base na extensão ou mime-type ---
const obterEstiloArquivo = (nomeArquivo) => {
  const extensao = nomeArquivo?.split('.').pop().toLowerCase();

  switch (extensao) {
    case 'pdf':
      return { icone: <FileText size={28} />, classeCor: 'arq-pdf' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return { icone: <FileImage size={28} />, classeCor: 'arq-imagem' };
    case 'xlsx':
    case 'xls':
    case 'csv':
      return { icone: <FileSpreadsheet size={28} />, classeCor: 'arq-excel' };
    default:
      return { icone: <File size={28} />, classeCor: 'arq-generico' };
  }
};

// ==========================================================
// COMPONENTE PRINCIPAL: MostrarArquivo
// ==========================================================
export default function MostrarArquivo({ arquivos = [], tituloCustomizado, exibirOrigem = false, onDelete }) {
  
  // Se não houver arquivos cadastrados para aquela solicitação, o componente não renderiza nada na gaveta
  if (!arquivos || arquivos.length === 0) {
    return null;
  }

  return (
    <div className="mostrar-arquivo-container">
      
      {/* Cabeçalho da área de visualização */}
      <div className="mostrar-arquivo-header">
        <Paperclip size={18} />
        <h3>{tituloCustomizado || 'Arquivos de Suporte / Anexos Vinculados'}</h3>
        <span className="mostrar-arquivo-qtd">({arquivos.length})</span>
      </div>

      {/* Grid/Lista de arquivos anexados */}
      <div className="mostrar-arquivo-lista">
        {arquivos.map((arq, index) => {
          const nomeFinal = arq.nome_arquivo || arq.name || `Arquivo_${index + 1}`;
          const urlFinal = arq.url_arquivo || arq.url || arq;
          const { icone, classeCor } = obterEstiloArquivo(nomeFinal);

          // 👇 Identifica quem mandou o arquivo (padrão é cliente se vier nulo)
          const origemFicheiro = arq.origem === 'logistica' ? 'Logística' : 'Cliente';

          return (
            <div key={index} className="mostrar-arquivo-item">
              
              {/* Lado Esquerdo: Ícone colorido + Nome */}
              <div className="mostrar-arquivo-info">
                <div className={`mostrar-arquivo-icone-wrapper ${classeCor}`}>
                  {icone}
                </div>
                <div className="mostrar-arquivo-textos">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mostrar-arquivo-nome" title={nomeFinal}>
                      {nomeFinal}
                    </span>
                    
                    {/* 👇 Se a prop 'exibirOrigem' for true, renderiza uma etiqueta discreta ao lado */}
                    {exibirOrigem && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: arq.origem === 'logistica' ? '#eff6ff' : '#f1f5f9',
                        color: arq.origem === 'logistica' ? '#2563eb' : '#475569',
                        border: `1px solid ${arq.origem === 'logistica' ? '#bfdbfe' : '#e2e8f0'}`
                      }}>
                        {origemFicheiro}
                      </span>
                    )}
                  </div>
                  
                  {arq.tamanho && (
                    <span className="mostrar-arquivo-tamanho">{arq.tamanho}</span>
                  )}
                </div>
              </div>

<div style={{ display: 'flex', gap: '8px' }}>
                
                {/* 👇 Só renderiza o botão de excluir se recebermos a função onDelete e se o arquivo tiver um ID do banco */}
                {onDelete && arq.id && (
                  <button 
                    onClick={() => onDelete(arq)} 
                    className="btn-download-mostrar"
                    style={{ color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
                    title="Excluir Anexo permanentemente"
                    type="button"
                  >
                    <Trash2 size={14} />
                    <span>Excluir</span>
                  </button>
                )}

                <a href={urlFinal} target="_blank" rel="noopener noreferrer" className="btn-download-mostrar">
                  <Download size={14} />
                  <span>Visualizar</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}