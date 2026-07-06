require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inicialização do App
const app = express();
const PORT = process.env.PORT || 3001; // O React geralmente roda na 5173, deixamos o backend na 3001

// ==========================================
// MIDDLEWARES
// ==========================================
// Habilita o CORS para permitir requisições do frontend
app.use(cors()); 

// Habilita o parseamento de JSON no corpo das requisições (req.body)
app.use(express.json()); 

// ==========================================
// ROTAS BÁSICAS
// ==========================================
// Rota de Health Check (Apenas para testar se o servidor está online)
// ==========================================
// ROTAS BÁSICAS
// ==========================================
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online', mensagem: 'API NexusLog rodando com sucesso! 🚀' });
});

// Pluga as rotas de solicitações que acabamos de criar!
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
app.use('/api/solicitacoes', solicitacoesRoutes);

// Exemplo de estrutura para rotas futuras:
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/solicitacoes', require('./routes/solicitacoesRoutes'));

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`[Servidor] Rodando perfeitamente na porta ${PORT}`);
});