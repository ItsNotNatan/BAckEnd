// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Ponto de entrada com Express + Socket.io para Tempo Real
// =================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');           // ✨ 1. Importa o módulo HTTP nativo
const { Server } = require('socket.io'); // ✨ 2. Importa o Socket.io

// Importação das Rotas da Aplicação
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes'); 
const estoqueRoutes = require('./src/routes/estoqueRoutes');
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
const filiaisRoutes = require('./src/routes/filiaisRoutes');

const app = express();

// =================================================================
// 🌐 CONFIGURAÇÃO DO SERVIDOR HTTP + SOCKET.IO
// =================================================================
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Permite conexões de qualquer frontend
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS']
  }
});

// Disponibiliza o 'io' globalmente na app (caso precise de emitir eventos nos controllers)
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado ao tempo-real (Socket ID): ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
  });
});

// =================================================================
// ⚡ MIDDLEWARE DE EMISSÃO AUTOMÁTICA DE EVENTOS (Baseado no ATMLog)
// =================================================================
// Sempre que houver uma alteração bem-sucedida, avisa o frontend instantaneamente
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const endpoint = req.path || req.originalUrl || '';
      
      if (endpoint.includes('/estoque')) {
        io.emit('estoque_atualizado');
      } else if (endpoint.includes('/solicitacoes')) {
        io.emit('solicitacoes_atualizadas');
      } else if (endpoint.includes('/filiais')) {
        io.emit('filiais_atualizadas');
      } else if (endpoint.includes('/usuarios')) {
        io.emit('usuarios_atualizados');
      }
    });
  }
  next();
});

// =================================================================
// 🛡️ CONFIGURAÇÃO DE CORS E MIDDLEWARES DA API
// =================================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =================================================================
// 🔗 REGISTO DAS ROTAS DA API
// =================================================================
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes); 
app.use('/api/estoque', estoqueRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/filiais', filiaisRoutes);

// 🩺 Rota de Diagnóstico (Health Check para o Render)
app.get('/', (req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: '🚀 API NexusLog está online, com WebSocket ativo e operacional!'
  });
});

// =================================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR (Usando httpServer em vez de app.listen)
// =================================================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor NexusLog + Socket.io a rodar perfeitamente na porta ${PORT}`);
});