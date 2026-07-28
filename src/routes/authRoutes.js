// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Corrigido a importação baseada no seu arquivo
const jwt = require('jsonwebtoken'); // 👈 IMPORTAÇÃO NOVA

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // 1. Validação básica
  if (!email || !senha) {
    return res.status(400).json({ 
      sucesso: false, 
      erro: 'E-mail e senha são obrigatórios.' 
    });
  }

  try {
    // 2. Busca o usuário no banco de dados
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, cargo, filial_padrao_id')
      .eq('email', email)
      .eq('senha', senha) 
      .single();

    // 3. Se deu erro na busca ou não encontrou ninguém
    if (error || !usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        erro: 'E-mail ou senha incorretos.' 
      });
    }

    // 4. ✨ A MAGIA AQUI: Gerar o Token JWT!
    // Ele assina o token com o ID, email e cargo, usando a chave secreta do seu .env
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        cargo: usuario.cargo 
      },
      process.env.SUPABASE_JWT_SECRET, // 👈 Garanta que tem isso no seu .env do Node!
      { expiresIn: '8h' } // O token expira em 8 horas
    );

    // 5. Devolve os dados do usuário e o TOKEN gerado
    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      token: token, // 👈 ENVIANDO O TOKEN PARA O REACT
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email,
        cargo: usuario.cargo,
        filial: usuario.filial_padrao_id
      }
    });

  } catch (error) {
    console.error('Erro na rota de login:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro interno no servidor.' 
    });
  }
});

module.exports = router;