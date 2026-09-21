// ==========================================
// FILE: src/config/corsOptions.js
// ==========================================

// Lista de origens permitidas lidas diretamente das variáveis de ambiente (.env)
const origensPermitidas = [
    process.env.CLIENT_URL || 'http://localhost:5175',
    process.env.LOGISTICS_URL || 'http://localhost:5173',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5173'
];

// Exporta o array para ser utilizado no app.js e no server.js
module.exports = origensPermitidas;