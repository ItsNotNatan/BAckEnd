// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Ponto de entrada da aplicação Node.js / Express
// =================================================================

require('dotenv').config(); // Carrega as variáveis do ficheiro .env
const express = require('express');
const cors = require('cors');

// Importação das Rotas (🛡️ CORREÇÃO: Alinhado para 'usuariosRoutes' no plural)
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes'); 
const estoqueRoutes = require('./src/routes/estoqueRoutes');
const solicitacoesRoutes = require('./src/routes/solicitacoesRoutes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Registro das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes); // 🟢 Rota de utilizadores agora mapeada corretamente
app.use('/api/estoque', estoqueRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);

// Inicialização do Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor NexusLog a rodar perfeitamente na porta ${PORT}`);
});