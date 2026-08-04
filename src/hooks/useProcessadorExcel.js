import { useState } from 'react';
import { processarExcelComProgresso } from '../utils/excelUtils';

export function useProcessadorExcel() {
  const [estaProcessando, setEstaProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [estadoProgresso, setEstadoProgresso] = useState({ fase: '', progresso: 0 });
  const [resultado, setResultado] = useState(null);
  const [erroFatal, setErroFatal] = useState(null);

  const iniciarProcessamento = async (file) => {
    setEstaProcessando(true);
    setConcluido(false);
    setErroFatal(null);
    setEstadoProgresso({ fase: 'Iniciando...', progresso: 0 });

    try {
      const resposta = await processarExcelComProgresso(file, (info) => {
        setEstadoProgresso(info);
      });
      
      setResultado(resposta);
      setConcluido(true);
      return resposta.itens; // Retorna os dados para a tela
      
    } catch (error) {
      setErroFatal(error);
    } finally {
      setEstaProcessando(false);
    }
  };

  const resetarProcessador = () => {
    setEstaProcessando(false);
    setConcluido(false);
    setResultado(null);
    setErroFatal(null);
    setEstadoProgresso({ fase: '', progresso: 0 });
  };

  return {
    estaProcessando,
    concluido,
    estadoProgresso,
    resultado,
    erroFatal,
    iniciarProcessamento,
    resetarProcessador
  };
}