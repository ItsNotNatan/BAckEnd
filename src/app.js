// ==========================================
// FILE: src/app.js
// ==========================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// 1. Importação da lista de origens autorizadas (Front-ends)
const origensPermitidas = require('./config/corsOptions');
const tratarErros = require('./middlewares/tratarErros');
const rotasDeDispositivos = require('./routes/dispositivos');

// 2. Inicialização do servidor Express
const app = express();

// --- MIDDLEWARES DE SEGURANÇA E REGISTO ---

// Adiciona cabeçalhos de proteção
app.use(helmet());

// Permite a comunicação com os nossos Front-ends
app.use(cors({
    origin: origensPermitidas,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Regista os acessos no terminal para facilitar a nossa depuração
app.use(morgan('dev'));

// Permite que o servidor entenda dados enviados no formato JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROTAS DA APLICAÇÃO ---

// Rota padrão para verificar se o servidor está online
app.get('/api/status', (req, res) => {
    res.status(200).json({
        mensagem: 'Servidor NexusFactory está operacional!',
        timestamp: new Date().toISOString()
    });
});

// Avisamos o servidor para usar as rotas no caminho '/api/dispositivos'
app.use('/api/dispositivos', rotasDeDispositivos);

// ==========================================
// TRATAMENTO GLOBAL DE ERROS (A REDE DE SEGURANÇA)
// ==========================================
// OBRIGATÓRIO: Tem de ser a última coisa antes do module.exports!
app.use(tratarErros);

// Exportamos a aplicação configurada para o server.js
module.exports = app;