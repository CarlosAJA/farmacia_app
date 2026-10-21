const express = require('express');
const router = express.Router();
const controller = require('./compras.controller.js');
const { verificarToken, permitirRoles } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);

router.post('/', permitirRoles('admin', 'almacenero'), controller.crear);
router.put('/:id/recibir', permitirRoles('admin', 'almacenero'), controller.recibir);
router.put('/:id/cancelar', permitirRoles('admin', 'almacenero'), controller.cancelar);

module.exports = router;