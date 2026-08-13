const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/filiaisController');
const verificarToken = require('../middlewares/authMiddleware');

// 🟢 ROTA PÚBLICA (O Cliente precisa ler as filiais para o Header)
router.get('/listar', ctrl.listar);

// 🔴 ROTAS PROTEGIDAS (Apenas a Logística pode criar ou apagar filiais)
router.post('/criar', verificarToken, ctrl.criar);
router.delete('/:id', verificarToken, ctrl.deletar);

module.exports = router;