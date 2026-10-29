const express = require('express');
const router = express.Router();
const controller = require('./clientes.controller.js');
const { verificarToken } = require('../../../authMiddleware.js');

router.use(verificarToken);
router.get('/:nit', controller.buscarPorNit);
router.get('/', controller.listar);
router.get('/:id/historial', controller.historial);

module.exports = router;