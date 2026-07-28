// src/routes/estoqueRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estoqueController');

// 🟢 ROTA PÚBLICA: O cliente pode ver o estoque sem login
router.get('/listar', ctrl.listar);

module.exports = router;