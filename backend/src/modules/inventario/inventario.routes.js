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
router.post('/transferir', permitirRoles('admin', 'almacenero'), controller.transferir);

router.post('/lotes', controller.agregarLote); // Para crear un lote
router.get('/lotes', controller.obtenerLotes); // Para ver los lotes de un producto

module.exports = router;