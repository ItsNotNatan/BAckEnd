// authRoutes.js (ou no seu arquivo principal de rotas)
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase'); // Ajuste o caminho conforme o seu projeto

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
      .select('id, nome_completo, email, cargo, filial_padrao_id') // Não trazemos a senha por segurança
      .eq('email', email)
      .eq('senha', senha) // Como estamos usando senha em texto puro por enquanto
      .single();

    // 3. Se deu erro na busca ou não encontrou ninguém
    if (error || !usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        erro: 'E-mail ou senha incorretos.' 
      });
    }

    // 4. Se tudo deu certo, devolve os dados do usuário logado
    res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
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