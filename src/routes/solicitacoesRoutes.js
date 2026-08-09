// =================================================================
// ARQUIVO: src/routes/solicitacoesRoutes.js
// DESCRIÇÃO: Gestão das rotas da API para solicitações
// =================================================================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/solicitacoesController');
const verificarToken = require('../middlewares/authMiddleware');

// ==========================================================
// 🟢 ROTAS PÚBLICAS (CLIENTE PODE USAR SEM LOGIN)
// ==========================================================
router.get('/listar', ctrl.listar); 
router.post('/material', ctrl.criarMaterial);
router.post('/transferencia', ctrl.criarTransferencia);
router.post('/entrada', ctrl.criarEntrada);
router.post('/crossdocking', ctrl.criarCrossdocking);
router.post('/nota-fiscal', ctrl.criarNotaFiscal);
router.post('/reintegracao', ctrl.criarReintegracao);
router.post('/cancelamento', ctrl.cancelarPL); 

// ==========================================================
// 🔴 ROTAS PROTEGIDAS (SÓ A LOGÍSTICA PODE USAR)
// ==========================================================
router.post('/reverter', verificarToken, ctrl.reverterItem);
router.post('/:id/anexos', verificarToken, ctrl.adicionarAnexosExtras); 
router.patch('/:id/itens', verificarToken, ctrl.atualizarItens);
router.patch('/:id/status', verificarToken, ctrl.atualizarStatus);
router.patch('/:id/local', verificarToken, ctrl.atualizarLocalizacao);
router.delete('/anexo/:anexoId', verificarToken, ctrl.removerAnexo);

// ✨ ROTA CORRIGIDA: Agora a pesquisa é feita pela ID única da prateleira no estoque!
router.get('/demandas/estoque/:estoqueId', ctrl.listarDemandasPorEstoque);

module.exports = router;