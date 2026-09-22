// ==========================================
// FILE: src/config/corsOptions.js (BACK-END)
// ==========================================

const origensPermitidas = [
    process.env.CLIENT_URL || 'http://localhost:5175',
    process.env.LOGISTICS_URL || 'http://localhost:5173',
    'http://localhost:5174', // <-- Adicionámos a porta fixa da Logística!
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'  // <-- Adicionámos o IP correspondente
];

module.exports = origensPermitidas;