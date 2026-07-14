// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/solicitacoesController');

// ==========================================================
// ROTAS MODULARIZADAS DE SOLICITAÇÕES
// ==========================================================

router.get('/listar', ctrl.listar);

router.post('/material', ctrl.criarMaterial);
router.post('/transferencia', ctrl.criarTransferencia);
router.post('/entrada', ctrl.criarEntrada);
router.post('/crossdocking', ctrl.criarCrossdocking);
router.post('/nota-fiscal', ctrl.criarNotaFiscal);
router.post('/reintegracao', ctrl.criarReintegracao);
router.post('/cancelamento', ctrl.cancelarBS);

module.exports = router;