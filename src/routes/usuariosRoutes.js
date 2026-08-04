// =================================================================
// ARQUIVO: src/routes/usuariosRoutes.js
// DESCRIÇÃO: Rotas de gestão de utilizadores protegidas por JWT
// =================================================================

const express = require('express');
const router = express.Router();

// 1. Importamos o Controller que já contém toda a lógica (listar, criar, atualizar, deletar)
const ctrl = require('../controllers/usuariosController');

// 2. Importamos o Middleware de segurança
const verificarToken = require('../middlewares/authMiddleware'); 

// ==========================================================
// 🔴 ROTAS PROTEGIDAS (EXIGEM TOKEN JWT VÁLIDO)
// ==========================================================

// Listar todos os utilizadores
router.get('/listar', verificarToken, ctrl.listar);

// Criar um novo utilizador (A rota que estava a faltar!)
router.post('/criar', verificarToken, ctrl.criar);

// Atualizar um utilizador existente (Também estava a faltar!)
router.patch('/:id', verificarToken, ctrl.atualizar);

// Excluir um utilizador com confirmação de senha
router.delete('/:id', verificarToken, ctrl.deletar);

module.exports = router;