const express = require('express');
const router = express.Router();
const controller = require('./ventas.controller.js');
const { verificarToken, permitirRoles } = require('../../../authMiddleware.js');

router.use(verificarToken);

// Lectura
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Crear venta: admin, vendedor
router.post('/', permitirRoles('admin', 'vendedor'), controller.crear);

// Anular venta: solo admin
router.put('/:id/anular', permitirRoles('admin'), controller.anular);

module.exports = router;