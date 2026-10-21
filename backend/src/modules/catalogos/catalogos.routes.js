const express = require('express');
const router = express.Router();
const controller = require('./catalogos.controller.js');
const { verificarToken } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/proveedores', controller.proveedores);
router.get('/productos', controller.productos);
router.get('/almacenes', controller.almacenes);

module.exports = router;