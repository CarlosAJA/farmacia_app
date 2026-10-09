const express = require('express');
const router = express.Router();
const controller = require('./categorias.controller.js');
const { verificarToken, permitirRoles } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Solo admin puede crear, actualizar, eliminar
router.post('/', permitirRoles('admin'), controller.crear);
router.put('/:id', permitirRoles('admin'), controller.actualizar);
router.delete('/:id', permitirRoles('admin'), controller.eliminar);

module.exports = router;