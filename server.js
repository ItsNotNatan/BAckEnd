// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Ponto de entrada da aplicação Node.js / Express
// =================================================================

require('dotenv').config(); // Carrega as variáveis do ficheiro .env
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Registro das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Inicialização do Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor NexusLog a rodar na porta ${PORT}`);
});