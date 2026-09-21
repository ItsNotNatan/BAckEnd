// ==========================================
// FILE: src/routes/dispositivos.js
// ==========================================
const express = require('express');
const router = express.Router();

// 1. Importações dos nossos Controladores e Middlewares Profissionais
const dispositivosController = require('../controllers/dispositivosController');
const validarSchema = require('../middlewares/validarSchema');
const asyncHandler = require('../middlewares/asyncHandler');
const dispositivoSchema = require('../schemas/dispositivoSchema');

// ==========================================
// DEFINIÇÃO DAS ROTAS
// ==========================================

// ROTA GET: Buscar a lista de dispositivos (Usada na tela de Acompanhamento)
// Protegida pelo asyncHandler para evitar que falhas de rede travem o servidor
router.get(
    '/',
    asyncHandler(dispositivosController.listarDispositivos)
);

// ROTA POST: Criar um novo dispositivo (Usada no envio do Formulário)
// A linha de montagem: Valida os dados -> Captura Erros Assíncronos -> Executa o Controlador
router.post(
    '/',
    validarSchema(dispositivoSchema),
    asyncHandler(dispositivosController.criarDispositivo)
);

module.exports = router;