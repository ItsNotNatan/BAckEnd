import React, { useState, useRef } from 'react';
import './CarregarArquivo.css';
import { Upload, FilePlus } from 'lucide-react';

export default function CarregarArquivo({ 
  onFileSelect, 
  accept = "*", 
  label = "Clique ou arraste um arquivo", 
  variante = "area", // Pode ser "area" ou "botao"
  icone // Ícone customizado opcional
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // --- EVENTOS DE DRAG & DROP ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Pega o ficheiro que foi arrastado
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]); 
      e.dataTransfer.clearData(); // Limpa a memória do navegador
    }
  };

  // --- EVENTOS DE CLIQUE E SELEÇÃO ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]); 
    }
    // Reseta o input para permitir selecionar o mesmo ficheiro duas vezes seguidas
    e.target.value = ''; 
  };

  const handleClick = () => {
    // A interrogação garante que não dá erro se o ref estiver vazio
    fileInputRef.current?.click();
  };

  // ==========================================
  // RENDERIZAR A VERSÃO: BOTÃO
  // ==========================================
  if (variante === 'botao') {
    return (
      <button 
        className="upload-botao" 
        onClick={handleClick}
        type="button"
      >
        <input 
          type="file" 
          accept={accept}
          className="input-escondido"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {icone ? icone : <FilePlus size={16} />}
        {label}
      </button>
    );
  }

  // ==========================================
  // RENDERIZAR A VERSÃO: ÁREA (Dropzone)
  // ==========================================
  return (
    <div 
      className={`upload-area ${isDragging ? 'arrastando' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        accept={accept}
        className="input-escondido"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {icone ? icone : <Upload size={24} className="icone" />}
      <span className="upload-texto">{label}</span>
    </div>
  );
}