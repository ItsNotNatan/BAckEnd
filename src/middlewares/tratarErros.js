// ==========================================
// FILE: src/middlewares/tratarErros.js
// ==========================================

// No Express, ter 4 parâmetros identifica este middleware como O TRATADOR DE ERROS
const tratarErros = (err, req, res, next) => {
    console.error("🚨 Erro não tratado capturado no servidor:", err.stack || err.message);

    // Se o erro tiver um status personalizado usa-o, caso contrário assume 500 (Erro Interno)
    const statusCode = err.statusCode || 500;
    const mensagem = err.message || 'Ocorreu uma falha interna no servidor.';

    return res.status(statusCode).json({
        sucesso: false,
        erro: mensagem
    });
};

module.exports = tratarErros;