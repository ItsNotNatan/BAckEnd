import * as XLSX from 'xlsx';

/**
 * Processa o Excel em lotes para não congelar a tela e emitir o progresso.
 */
export const processarExcelComProgresso = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    onProgress({ fase: 'Lendo arquivo...', progresso: 10 });
    
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        onProgress({ fase: 'Abrindo planilha...', progresso: 30 });
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        onProgress({ fase: 'Convertendo dados...', progresso: 50 });
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", blankrows: false });

        const totalLinhas = json.length;
        const itensValidos = [];
        const ignorados = [];
        const erros = [];
        
        let linhaAtual = 0;
        const tamanhoLote = 500; // Processa 500 linhas por vez

        // Função recursiva para processar em lotes (evita travar a UI)
        const processarLote = () => {
          const limite = Math.min(linhaAtual + tamanhoLote, totalLinhas);
          for (let i = linhaAtual; i < limite; i++) {
            const linha = json[i];
            
            // Regra de Validação
            if (!linha['Nº peça fabricante'] && !linha['DESENHO SAP'] && !linha['Material Description']) {
              ignorados.push(`Linha ${i + 2}: Vazia ou sem identificador principal.`);
              continue;
            }

            try {
              const qtd = Number(linha['Qtd.fornecida']) || 1;
              itensValidos.push({
                id: `excel-${Date.now()}-${i}`,
                desenhoSAP: linha['DESENHO SAP'] || '-',
                materialDescription: linha['Material Description'] || 'Sem descrição',
                numPecaFabricante: linha['Nº peça fabricante'] || '-',
                fornecedor: linha['Fornecedor'] || '-',
                qtdSelecionada: qtd,
                referencia: linha['Referência'] || '-',
                unidadeMedida: linha['Unidade de medida'] || '-',
                vendorDescription: linha['Vendor Description'] || '-',
                wbs: linha['WBS'] || '-',
                emissaoNF: linha['EMISSÃO NF'] || '-',
                recebNF: linha['RECEB. NF'] || '-',
                docCompras: linha['Documento de compras'] || '-',
                poNetPrice: linha['PO Net Price'] ? (String(linha['PO Net Price']).includes('R$') ? linha['PO Net Price'] : `R$ ${linha['PO Net Price']}`) : 'R$ 0,00',
                centro: linha['Centro'] || '-',
                deposito: linha['Depósito'] || '-',
                alocacao: linha['Alocação'] || '-'
              });
            } catch (err) {
              erros.push(`Linha ${i + 2}: Erro de formatação (${err.message})`);
            }
          }

          linhaAtual = limite;
          
          // Calcula a percentagem visual (de 50% a 100% durante o mapeamento)
          const progressoCalculado = 50 + Math.floor((linhaAtual / totalLinhas) * 50);
          onProgress({ 
            fase: `Processando linha ${linhaAtual} de ${totalLinhas}...`, 
            progresso: progressoCalculado 
          });
          
          if (linhaAtual < totalLinhas) {
            // Agenda o próximo lote deixando o navegador respirar (renderizar a barra)
            setTimeout(processarLote, 10);
          } else {
            // Finalizado!
            resolve({
              itens: itensValidos,
              estatisticas: {
                totalLido: totalLinhas,
                sucesso: itensValidos.length,
                ignorados: ignorados.length,
                errosLista: erros
              }
            });
          }
        };

        // Inicia o processamento em lotes
        setTimeout(processarLote, 50);
      } catch (error) {
        reject('Erro fatal ao processar o ficheiro Excel.');
      }
    };

    reader.onerror = () => reject('Erro de leitura do ficheiro.');
    reader.readAsBinaryString(file);
  });
};

/**
 * Função simplificada para ler o SAP diretamente, retornando apenas o array de itens.
 * Utilizada na página de Consulta de Estoque.
 */
export const lerRelatorioSAP = async (file) => {
  // Chamamos a função principal passando uma função vazia para o onProgress
  const resultado = await processarExcelComProgresso(file, () => {});
  return resultado.itens;
};