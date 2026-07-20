// src/routes/estoqueRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/estoqueController');

// Define o endpoint de listagem
router.get('/listar', ctrl.listar);

module.exports = router;