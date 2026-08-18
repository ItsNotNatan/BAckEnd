// src/routes/estoqueRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estoqueController');
const verificarToken = require('../middlewares/authMiddleware'); // ✨ Importamos a segurança

// 🟢 ROTA PÚBLICA: O cliente pode ver o estoque sem login
router.get('/listar', ctrl.listar);

// 🔴 ROTA PROTEGIDA: Apenas a logística (com token JWT) pode editar o estoque
router.patch('/:id', verificarToken, ctrl.atualizar);

module.exports = router;