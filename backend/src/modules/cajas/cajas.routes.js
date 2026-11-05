const express = require('express');
const router = express.Router();
const controller = require('./cajas.controller.js');
const { verificarToken } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/activa', controller.verificar);
router.post('/abrir', controller.abrir);
router.get('/:id/resumen', controller.resumen);
router.post('/:id/cerrar', controller.cerrar);

module.exports = router;