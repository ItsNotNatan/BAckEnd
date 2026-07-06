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

// Importa e pluga o arquivo de rotas que configuramos acima
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');
app.use('/api/solicitacoes', solicitacoesRoutes);

// INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
  console.log(`[Servidor] Rodando perfeitamente na porta ${PORT}`);
});