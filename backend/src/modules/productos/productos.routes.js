const express = require('express');
const router = express.Router();
const controller = require('./productos.controller.js');
const { verificarToken, permitirRoles } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/', controller.listar);
router.get('/alertas', controller.alertas);   // ⚠️ antes de /:id
router.get('/:id', controller.obtener);

router.post('/', permitirRoles('admin', 'farmaceutico'), controller.crear);
router.put('/:id', permitirRoles('admin', 'farmaceutico'), controller.actualizar);
router.delete('/:id', permitirRoles('admin'), controller.eliminar);

module.exports = router;