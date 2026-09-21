// =================================================================
// ARQUIVO: src/services/backupExcelService.js
// DESCRIÇÃO: Serviço responsável por exportar os dados do sistema
// para um ficheiro Excel e guardá-lo como backup automaticamente.
// =================================================================

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Usamos o axios pois é a nossa ponte para o Supabase

/**
 * Função principal que gera o backup em Excel.
 * Consulta a tabela de dispositivos no Supabase e escreve num ficheiro .xlsx.
 */
async function gerarBackupExcel() {
    try {
        console.log('\n📊 [BACKUP EXCEL] Iniciando a geração do backup automático...');

        // 1. Criação de um novo "Livro" de Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'NexusFactory Auto-Backup';
        workbook.created = new Date();

        // 2. Adicionar uma "Folha" para os Dispositivos
        const sheetDispositivos = workbook.addWorksheet('Dispositivos Registados');

        // 3. Definir as colunas (cabeçalhos) e larguras com base no nosso formulário
        sheetDispositivos.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'PROJETO', key: 'projeto', width: 20 },
            { header: 'LINHA', key: 'linha', width: 20 },
            { header: 'OPERAÇÃO', key: 'operacao', width: 20 },
            { header: 'TIPO DISPOSITIVO', key: 'tipo', width: 25 },
            { header: 'DESCRIÇÃO', key: 'descricao', width: 40 },
            { header: 'STATUS', key: 'status', width: 15 }
        ];

        // 4. Estilizar o cabeçalho (fundo azul, texto branco, negrito)
        sheetDispositivos.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetDispositivos.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

        // 5. Buscar os dados no Supabase (Nossa base de dados atual)
        const urlSupabase = `${process.env.SUPABASE_URL}/rest/v1/dispositivos`;
        const resposta = await axios.get(urlSupabase, {
            headers: {
                'apikey': process.env.SUPABASE_SECRET_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`
            }
        });

        const dispositivos = resposta.data;

        // 6. Inserir os dados linha a linha no Excel
        dispositivos.forEach(item => {
            sheetDispositivos.addRow({
                id: item.id || '-',
                projeto: item.projeto || '-',
                linha: item.linha || '-',
                operacao: item.operacao || '-',
                tipo: item.tipo_dispositivo || '-',
                descricao: item.descricao || '-',
                status: item.status || 'pendente'
            });
        });

        // 7. Configurar a pasta onde os backups vão ficar guardados
        // Vai criar uma pasta "BackupsExcel" na raiz do teu projeto Back-end
        const pastaDestino = path.join(__dirname, '../../BackupsExcel');

        // Se a pasta não existir, o Node.js cria-a automaticamente
        if (!fs.existsSync(pastaDestino)) {
            fs.mkdirSync(pastaDestino, { recursive: true });
        }

        // 8. Gerar o nome do ficheiro com a data e hora atual
        // Usamos o formato YYYY-MM-DD_HH-MM para não haver erros no Windows
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 16);
        const nomeArquivo = `Backup_NexusFactory_${dataFormatada}.xlsx`;
        const caminhoCompleto = path.join(pastaDestino, nomeArquivo);

        // 9. Escrever o ficheiro no disco
        await workbook.xlsx.writeFile(caminhoCompleto);

        console.log(`✅ [BACKUP EXCEL] Concluído com sucesso! Guardado em: ${caminhoCompleto}\n`);

    } catch (error) {
        console.error('❌ [BACKUP EXCEL] Ocorreu um erro ao gerar o Excel:', error.message);
    }
}

module.exports = { gerarBackupExcel };