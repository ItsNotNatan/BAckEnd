require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 👇 1. Importamos o seu middleware de segurança
const verificarToken = require('./src/middlewares/authMiddleware');

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

// Rotas de Autenticação (Público - Todos podem tentar fazer login)
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// 👇 2. Rotas Protegidas: Agora exigem a validação do Token (verificarToken)
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
app.use('/api/solicitacoes', verificarToken, solicitacoesRoutes);

const estoqueRoutes = require('./src/routes/estoqueRoutes');
app.use('/api/estoque', verificarToken, estoqueRoutes);

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`[Servidor] Rodando perfeitamente na porta ${PORT} 🛡️ (Rotas Protegidas)`);
});