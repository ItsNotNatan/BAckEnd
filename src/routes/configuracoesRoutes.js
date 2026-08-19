const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configuracoesController');
const verificarToken = require('../middlewares/authMiddleware'); 

// Rotas protegidas para Administradores
router.get('/target', verificarToken, ctrl.obter);
router.post('/target', verificarToken, ctrl.atualizar);

module.exports = router;