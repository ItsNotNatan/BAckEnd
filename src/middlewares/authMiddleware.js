// =================================================================
// ARQUIVO: src/middlewares/verificarToken.js
// DESCRIÇÃO: Middleware de segurança JWT para rotas protegidas
// =================================================================

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  // 1. EXTRAIR O CABEÇALHO AUTHORIZATION
  const authHeader = req.headers['authorization'];
  
  // O formato esperado é "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  // 2. VERIFICAR SE O TOKEN FOI FORNECIDO
  if (!token) {
    return res.status(401).json({ 
      sucesso: false, 
      erro: 'Erro: Token de acesso não fornecido. Faça login novamente.' 
    });
  }

  // 3. VALIDAR A ASSINATURA DO TOKEN JWT
  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, (err, usuarioDecodificado) => {
    if (err) {
      console.error('❌ Falha na validação do JWT:', err.message);
      return res.status(403).json({ 
        sucesso: false, 
        erro: 'Erro: Sessão expirada ou token inválido. Faça login novamente.' 
      });
    }

    // 4. INJETAR OS DADOS DO UTILIZADOR NA REQUISIÇÃO
    // Permite que os controllers saibam quem é o utilizador logado (req.usuario.id)
    req.usuario = usuarioDecodificado;
    next(); // Permite continuar para a rota pretendida
  });
}

module.exports = verificarToken;