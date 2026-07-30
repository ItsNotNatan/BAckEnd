require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inicialização do App
const app = express();
const PORT = process.env.PORT || 3001;

// MIDDLEWARES
app.use(cors()); 
app.use(express.json()); 

// ROTAS BÁSICAS
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online', mensagem: 'API NexusLog rodando com sucesso! 🚀' });
});

// ==========================================
// REGISTRO DE ROTAS
// ==========================================

// Rotas de Autenticação
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// 👇 1. MUDANÇA AQUI: Removemos o verificarToken do server.js!
// A porta principal está aberta. A segurança agora fica em cada rota específica.
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
app.use('/api/solicitacoes', solicitacoesRoutes);

const estoqueRoutes = require('./src/routes/estoqueRoutes');
app.use('/api/estoque', estoqueRoutes);

const usuariosRoutes = require('./src/routes/usuariosRoutes');
app.use('/api/usuarios', usuariosRoutes);

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`[Servidor] Rodando perfeitamente na porta ${PORT} 🚀`);
});