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
router.post('/reverter', ctrl.reverterItem);

// 👇 NOVA ROTA ADICIONADA PARA OS ANEXOS EXTRAS DA LOGÍSTICA
router.post('/:id/anexos', ctrl.adicionarAnexosExtras); 

router.patch('/:id/status', ctrl.atualizarStatus);

// 👇 Adiciona junto das tuas outras rotas (perto da rota POST de anexos que fizemos antes)
router.delete('/anexo/:anexoId', ctrl.removerAnexo);
module.exports = router;