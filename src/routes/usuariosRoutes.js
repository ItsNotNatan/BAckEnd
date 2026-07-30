// src/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');
const verificarToken = require('../middlewares/authMiddleware');

// ⚠️ DESATIVADO TEMPORARIAMENTE PARA TESTES NO FRONTEND
// Ao comentar esta linha, o segurança deixa as rotas passarem livremente.
// Lembrete: Devemos remover as barras '//' quando formos colocar o sistema em produção!
// router.use(verificarToken); 

router.get('/listar', ctrl.listar);
router.post('/criar', ctrl.criar);
router.patch('/:id', ctrl.atualizar);

module.exports = router;