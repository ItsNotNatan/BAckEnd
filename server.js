// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Ponto de entrada da aplicação Node.js / Express
// =================================================================

require('dotenv').config(); // Carrega as variáveis do ficheiro .env em ambiente local
const express = require('express');
const cors = require('cors');

// Importação das Rotas da Aplicação
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes'); 
const estoqueRoutes = require('./src/routes/estoqueRoutes');
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');

const app = express();

// =================================================================
// 🛡️ MIDDLEWARES GLOBAIS E SEGURANÇA (CORS)
// =================================================================
// Permite que o Frontend no Render (ou Localhost) comunique com esta API
app.use(cors({
  origin: '*', // Permite chamadas de qualquer origem
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

// 🩺 Rota de diagnóstico para o Render (Health Check)
app.get('/', (req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: '🚀 API NexusLog está online e operacional!'
  });
});

// =================================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// =================================================================
// O Render injeta automaticamente a porta necessária via process.env.PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor NexusLog a rodar perfeitamente na porta ${PORT}`);
});