// src/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/solicitacoesController');

// 👇 2. Importamos o seu middleware de segurança AQUI!
const verificarToken = require('../middlewares/authMiddleware');

// ==========================================================
// 🟢 ROTAS PÚBLICAS (CLIENTE PODE USAR SEM LOGIN)
// ==========================================================
router.get('/listar', ctrl.listar); // O cliente precisa listar para acompanhar os pedidos
router.post('/material', ctrl.criarMaterial);
router.post('/transferencia', ctrl.criarTransferencia);
router.post('/entrada', ctrl.criarEntrada);
router.post('/crossdocking', ctrl.criarCrossdocking);
router.post('/nota-fiscal', ctrl.criarNotaFiscal);
router.post('/reintegracao', ctrl.criarReintegracao);
router.post('/cancelamento', ctrl.cancelarBS);

// ==========================================================
// 🔴 ROTAS PROTEGIDAS (SÓ A LOGÍSTICA PODE USAR)
// Colocamos o "verificarToken" no meio, como um escudo!
// ==========================================================
router.post('/reverter', verificarToken, ctrl.reverterItem);
router.post('/:id/anexos', verificarToken, ctrl.adicionarAnexosExtras); 
router.patch('/:id/status', verificarToken, ctrl.atualizarStatus);
router.patch('/:id/local', verificarToken, ctrl.atualizarLocalizacao);
router.delete('/anexo/:anexoId', verificarToken, ctrl.removerAnexo);

module.exports = router;