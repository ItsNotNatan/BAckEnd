// ==========================================
// FILE: server.js
// ==========================================
// Carrega as variáveis de ambiente do ficheiro .env
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { Server } = require('socket.io');
const origensPermitidas = require('./src/config/corsOptions');

// Definimos a porta onde o servidor vai correr (lê do .env ou usa 3000 como padrão)
const PORT = process.env.PORT || 3000;

// Cria o servidor HTTP a partir da aplicação Express
const servidorHttp = http.createServer(app);

// --- CONFIGURAÇÃO DO SOCKET.IO (Tempo Real) ---
// Ligamos o Socket.io ao nosso servidor HTTP
const io = new Server(servidorHttp, {
    cors: {
        origin: origensPermitidas,
        methods: ["GET", "POST"]
    }
});

// Evento disparado sempre que um cliente (ex: o teu React) se conecta
io.on('connection', (socket) => {
    console.log(`🔌 Novo utilizador conectado (ID: ${socket.id})`);

    // Podemos criar eventos personalizados. 
    // Ex: O React avisa que um novo formulário foi salvo
    socket.on('novo_dispositivo_solicitado', (dados) => {
        console.log('Recebido alerta de novo dispositivo:', dados);

        // O servidor avisa TODOS os outros utilizadores conectados (ex: para atualizar a página de Aprovações)
        io.emit('atualizar_tabela_aprovacoes', dados);
    });

    // Evento quando o utilizador fecha a aba do navegador
    socket.on('disconnect', () => {
        console.log(`❌ Utilizador desconectado (ID: ${socket.id})`);
    });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
servidorHttp.listen(PORT, () => {
    console.log(`
    ==================================================
    🚀 Servidor NexusFactory iniciado com sucesso!
    📡 A escutar na porta: ${PORT}
    ==================================================
    `);
});