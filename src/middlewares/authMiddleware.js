const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  // 1. Pega o token que o frontend enviou no cabeçalho (Headers)
  const tokenHeader = req.headers.authorization;

  if (!tokenHeader) {
    return res.status(401).json({ sucesso: false, erro: 'Acesso negado. Você precisa estar logado.' });
  }

  // O token vem no formato "Bearer asdfg12345...", então separamos para pegar só o código
  const token = tokenHeader.split(' ')[1];

  try {
    // 2. Verifica se o crachá é verdadeiro usando a assinatura do Supabase
    const decodificado = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    
    // 3. Salva os dados do usuário logado dentro da requisição (aqui está o ID dele!)
    req.usuario = decodificado;
    
    // 4. Libera a catraca! Pode continuar para a rota.
    next();
  } catch (error) {
    console.error('[Erro de Token]:', error.message);
    return res.status(403).json({ sucesso: false, erro: 'Sessão expirada ou token inválido. Faça login novamente.' });
  }
};

module.exports = verificarToken;