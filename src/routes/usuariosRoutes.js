// =================================================================
// ARQUIVO: src/routes/usuarioRoutes.js
// DESCRIÇÃO: Rotas de gestão de utilizadores protegidas por JWT
// =================================================================

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const verificarToken = require('../middlewares/verificarToken'); // Importa a proteção JWT

/**
 * @route   GET /api/usuarios/listar
 * @desc    Lista todos os utilizadores cadastrados
 * @access  Protegido (Exige Token JWT)
 */
router.get('/listar', verificarToken, async (req, res) => {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, cargo, filial_padrao_id, filiais_acesso')
      .order('nome_completo', { ascending: true });

    if (error) {
      return res.status(400).json({ sucesso: false, erro: error.message });
    }

    res.status(200).json({ sucesso: true, dados: usuarios });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno no servidor.' });
  }
});

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Exclui um utilizador após confirmar a senha do administrador logado
 * @access  Protegido (Exige Token JWT)
 */
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { senha_admin } = req.body;
  const usuarioLogadoId = req.usuario.id; // Extraído do JWT pelo verificarToken

  // 1. Validação simples dos dados recebidos
  if (!senha_admin) {
    return res.status(400).json({ 
      sucesso: false, 
      erro: 'A senha de confirmação do administrador é obrigatória.' 
    });
  }

  try {
    // 2. Confirma a senha do Administrador que está a realizar a ação
    const { data: admin, error: erroAdmin } = await supabase
      .from('usuarios')
      .select('senha')
      .eq('id', usuarioLogadoId)
      .single();

    if (erroAdmin || !admin || admin.senha !== senha_admin) {
      return res.status(401).json({ 
        sucesso: false, 
        erro: 'Senha de confirmação incorreta. A exclusão foi cancelada.' 
      });
    }

    // 3. Executa a exclusão do utilizador-alvo na tabela
    const { error: erroExclusao } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (erroExclusao) {
      return res.status(400).json({ sucesso: false, erro: erroExclusao.message });
    }

    res.status(200).json({ 
      sucesso: true, 
      mensagem: 'Utilizador removido com sucesso!' 
    });

  } catch (error) {
    console.error('Erro crítico na exclusão:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno no servidor.' });
  }
});

module.exports = router;