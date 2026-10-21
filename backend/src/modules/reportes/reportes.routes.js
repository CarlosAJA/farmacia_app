const express = require('express');
const router = express.Router();
const controller = require('./reportes.controller.js');
const { verificarToken } = require('../../../authMiddleware.js');

router.use(verificarToken);

router.get('/dashboard', controller.dashboard);

module.exports = router;