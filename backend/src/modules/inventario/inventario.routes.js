const express = require('express');
const router = express.Router();
const controller = require('./inventario.controller.js');
const { verificarToken, permitirRoles } = require('../../../authMiddleware.js');

router.use(verificarToken);

// Listados: cualquier usuario autenticado
router.get('/', controller.listar);
router.get('/movimientos', controller.listarMovimientos);

// Ajustar cantidad: solo admin y almacenero
router.put('/:id/ajustar', permitirRoles('admin', 'almacenero'), controller.ajustar);

module.exports = router;