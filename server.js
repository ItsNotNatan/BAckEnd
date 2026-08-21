// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Ponto de entrada da aplicação Node.js / Express com Socket.io
// =================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');           // ✨ OBRIGATÓRIO PARA O SOCKET
const { Server } = require('socket.io'); // ✨ OBRIGATÓRIO PARA O SOCKET

// Importação das Rotas da Aplicação
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes'); 
const estoqueRoutes = require('./src/routes/estoqueRoutes');
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
const filiaisRoutes = require('./src/routes/filiaisRoutes');
const configuracoesRoutes = require('./src/routes/configuracoesRoutes');

const app = express();

// =================================================================
// 🌐 CONFIGURAÇÃO DO SERVIDOR HTTP + SOCKET.IO
// =================================================================
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🟢 [Frontend Conectado ao Radar] ID: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔴 [Frontend Desconectado] ID: ${socket.id}`);
  });
});

// =================================================================
// ⚡ MIDDLEWARE DE EMISSÃO AUTOMÁTICA DE EVENTOS (O RADAR)
// =================================================================
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.on('finish', () => {
      // Se a requisição foi um sucesso (Status 200 a 299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const endpoint = req.originalUrl || req.path || '';
        
        if (endpoint.includes('/estoque')) {
          console.log(`\n📡 [SOCKET.IO] Alteração no Estoque!`);
          io.emit('estoque_atualizado');
        } 
        else if (endpoint.includes('/solicitacoes') || endpoint.includes('/entrada') || endpoint.includes('/material')) {
          console.log(`\n📡 [SOCKET.IO] Nova Solicitação ou Status alterado!`);
          io.emit('solicitacoes_atualizadas');
        }
        else if (endpoint.includes('/filiais')) {
          console.log(`\n📡 [SOCKET.IO] Filial adicionada/removida!`);
          io.emit('filiais_atualizadas');
        }
        else if (endpoint.includes('/usuarios')) {
          console.log(`\n📡 [SOCKET.IO] Utilizador alterado!`);
          io.emit('usuarios_atualizados');
        }
        else if (endpoint.includes('/configuracoes')) {
          console.log(`\n📡 [SOCKET.IO] Configuração (Target) alterada!`);
          io.emit('configuracoes_atualizadas');
        }
      }
    });
  }
  next();
});

// =================================================================
// 🛡️ CONFIGURAÇÃO DE CORS E MIDDLEWARES
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
app.use('/api/configuracoes', configuracoesRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ sucesso: true, mensagem: '🚀 API NexusLog + Socket.io Online!' });
});

// =================================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR (MUITO IMPORTANTE USAR httpServer.listen)
// =================================================================
const PORT = process.env.PORT || 3001;

// Tem de ser httpServer.listen em vez de app.listen!
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor NexusLog a rodar com Tempo Real na porta ${PORT}`);
});