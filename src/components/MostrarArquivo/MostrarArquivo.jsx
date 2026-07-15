import React from 'react';
import { 
  FileText,      // Para documentos PDF / Textos
  FileImage,     // Para imagens (PNG, JPG, JPEG)
  FileSpreadsheet, // Para planilhas (Excel / CSV)
  File,          // Para arquivos genéricos
  Download,      // Ícone do botão de baixar
  Paperclip      // Ícone do cabeçalho
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
export default function MostrarArquivo({ arquivos = [], tituloCustomizado }) {
  
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
          // Se a sua API retornar um objeto complexo ou apenas a string da URL, tratamos aqui
          const nomeFinal = arq.nome_arquivo || arq.name || `Arquivo_${index + 1}`;
          const urlFinal = arq.url_arquivo || arq.url || arq;
          const { icone, classeCor } = obterEstiloArquivo(nomeFinal);

          return (
            <div key={index} className="mostrar-arquivo-item">
              
              {/* Lado Esquerdo: Ícone colorido + Nome */}
              <div className="mostrar-arquivo-info">
                <div className={`mostrar-arquivo-icone-wrapper ${classeCor}`}>
                  {icone}
                </div>
                <div className="mostrar-arquivo-textos">
                  <span className="mostrar-arquivo-nome" title={nomeFinal}>
                    {nomeFinal}
                  </span>
                  {arq.tamanho && (
                    <span className="mostrar-arquivo-tamanho">{arq.tamanho}</span>
                  )}
                </div>
              </div>

              {/* Lado Direito: Ação de Download */}
              <a 
                href={urlFinal} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-download-mostrar"
              >
                <Download size={14} />
                <span>Visualizar / Baixar</span>
              </a>

            </div>
          );
        })}
      </div>

    </div>
  );
}