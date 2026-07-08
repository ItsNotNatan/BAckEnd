// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();

// Importa apenas o Controller, que tem as funções de gestão
const solicitacoesController = require('../controllers/solicitacoesController');

// ==========================================================
// ROTAS DE SOLICITAÇÕES
// ==========================================================

// GET: Listar todas as solicitações
router.get('/listar', solicitacoesController.listar);

// POST: Criar uma nova Solicitação (PS)
router.post('/nova', solicitacoesController.criar);

module.exports = router;