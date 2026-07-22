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

// Rotas de Autenticação / Usuários (✨ NOVO)
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Rotas de Solicitações
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
app.use('/api/solicitacoes', solicitacoesRoutes);

// Rotas de Estoque
const estoqueRoutes = require('./src/routes/estoqueRoutes');
app.use('/api/estoque', estoqueRoutes);

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`[Servidor] Rodando perfeitamente na porta ${PORT}`);
});