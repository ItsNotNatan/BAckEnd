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
const filiaisRoutes = require('./src/routes/filiaisRoutes');


const app = express();

// =================================================================
// 🛡️ CONFIGURAÇÃO DE CORS E MIDDLEWARES
// =================================================================
// Configuração detalhada para evitar bloqueios no navegador ao comunicar com o Frontend
app.use(cors({
  origin: '*', // Permite requisições de qualquer origem (Frontend no Render)
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
    mensagem: '🚀 API NexusLog está online e operacional no Render!'
  });
});

// =================================================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// =================================================================
// O Render injeta dinamicamente a porta através da variável process.env.PORT
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor NexusLog a rodar perfeitamente na porta ${PORT}`);
});