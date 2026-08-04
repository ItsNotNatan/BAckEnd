// =================================================================
// ARQUIVO: src/routes/authRoutes.js
// DESCRIÇÃO: Rota de Autenticação (Login) com geração de Token JWT
// =================================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Conexão com a base de dados
const jwt = require('jsonwebtoken');           // Biblioteca para gerar os Tokens

/**
 * @route   POST /api/auth/login
 * @desc    Autentica o utilizador e devolve um Token JWT legítimo
 * @access  Público
 */
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // 1. VALIDAÇÃO BÁSICA DOS CAMPOS
  // Garante que o cliente não enviou dados vazios antes de consultar o banco.
  if (!email || !senha) {
    return res.status(400).json({ 
      sucesso: false, 
      erro: 'Por favor, introduza o e-mail e a senha.' 
    });
  }

  try {
    // 2. CONSULTA À BASE DE DADOS (SUPABASE)
    // Procuramos o utilizador correspondente ao e-mail e à senha fornecidos.
    // Buscamos explicitamente a coluna 'filiais_acesso' para o controle de permissões.
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, cargo, filial_padrao_id, filiais_acesso') 
      .eq('email', email)
      .eq('senha', senha) // Em produção, o ideal será encriptar com bcrypt no futuro
      .single();          // Traz apenas um único registo

    // 3. VERIFICAÇÃO DE CREDENCIAIS
    // Se o Supabase devolver erro ou não encontrar nenhum registo, barramos o acesso.
    if (error || !usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        erro: 'E-mail ou senha incorretos.' 
      });
    }

    // 4. GERAÇÃO DO TOKEN JWT REAL E SEGURO
    // O payload guarda dados essenciais do utilizador (id, email, cargo).
    // O token é assinado criptograficamente com a chave secreta do ficheiro .env.
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        cargo: usuario.cargo 
      },
      process.env.SUPABASE_JWT_SECRET, 
      { expiresIn: '8h' } // O token expira e invalida-se automaticamente após 8 horas
    );

    // 5. RESPOSTA DE SUCESSO
    // Enviamos o token legítimo e o objeto de perfil que o React vai utilizar.
    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso! Bem-vindo ao NexusLog.',
      token: token, 
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email,
        cargo: usuario.cargo,
        filial: usuario.filial_padrao_id,
        filiais_acesso: usuario.filiais_acesso || [] // Garante um array vazio se for nulo
      }
    });

  } catch (error) {
    console.error('Erro crítico na rota de login:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Ocorreu um erro interno no servidor ao tentar processar o login.' 
    });
  }
});

module.exports = router;