import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import './ExemploExcel.css'; // O CSS que vamos criar a seguir

export default function ExemploExcel() {
  const baixarModelo = async () => {
    try {
      // 1. Cria a estrutura do Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Modelo SAP');

      // 2. Define os nomes das colunas exatamente como o teu leitor espera
      const colunas = [
        'DESENHO SAP', 
        'Material Description', 
        'Nº peça fabricante', 
        'Fornecedor', 
        'Qtd.fornecida', 
        'Referência', 
        'Unidade de medida', 
        'Vendor Description', 
        'WBS', 
        'EMISSÃO NF', 
        'RECEB. NF', 
        'Documento de compras', 
        'PO Net Price', 
        'Centro', 
        'Depósito', 
        'Alocação'
      ];

      // Aplica as colunas na planilha com uma largura padrão de 20
      worksheet.columns = colunas.map(col => ({ header: col, key: col, width: 20 }));

      // 3. Estiliza o cabeçalho (Fundo azul, texto branco e negrito)
      const linhaCabecalho = worksheet.getRow(1);
      linhaCabecalho.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }; // Azul NexusLog
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      linhaCabecalho.height = 25;

      // 4. (Opcional) Adiciona uma linha de exemplo preenchida para guiar o utilizador
      worksheet.addRow({
        'DESENHO SAP': 'EX-SAP-123',
        'Material Description': 'Exemplo de Material',
        'Nº peça fabricante': 'PN-12345',
        'Fornecedor': 'Fornecedor A',
        'Qtd.fornecida': 10,
        'Referência': 'REF-001',
        'Unidade de medida': 'Unid',
        'Vendor Description': 'Desc Vendor',
        'WBS': 'WBS-EX-001',
        'EMISSÃO NF': '01/01/2026',
        'RECEB. NF': '05/01/2026',
        'Documento de compras': 'DOC-999',
        'PO Net Price': 'R$ 100,00',
        'Centro': 'BR01',
        'Depósito': '0010',
        'Alocação': 'A-01'
      });

      // 5. Gera o ficheiro e faz o download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, "Modelo_Importacao_SAP.xlsx");

    } catch (error) {
      console.error("Erro ao gerar o Excel:", error);
      alert("Houve um problema ao gerar o modelo Excel.");
    }
  };

  return (
    <button className="btn-exemplo-excel" onClick={baixarModelo} type="button">
      <Download size={16} />
      Baixar Modelo
    </button>
  );
}