// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); 
const jwt = require('jsonwebtoken'); 

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
    // 2. Busca o utilizador no banco de dados
    const { data: usuario, error } = await supabase
      .from('usuarios')
      // 👇 MUDANÇA: Adicionámos 'filiais_acesso' aqui
      .select('id, nome_completo, email, cargo, filial_padrao_id, filiais_acesso') 
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

    // 4. Gerar o Token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        cargo: usuario.cargo 
      },
      process.env.SUPABASE_JWT_SECRET, 
      { expiresIn: '8h' } 
    );

    // 5. Devolve os dados do utilizador e o TOKEN gerado
    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      token: token, 
      usuario: {
        id: usuario.id,
        nome: usuario.nome_completo,
        email: usuario.email,
        cargo: usuario.cargo,
        filial: usuario.filial_padrao_id,
        // 👇 MUDANÇA: Enviamos as filiais de acesso para o React!
        filiais_acesso: usuario.filiais_acesso || [] 
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