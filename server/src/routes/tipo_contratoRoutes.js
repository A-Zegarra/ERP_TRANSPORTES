// server/routes/tipo_contratoRoutes.js
const express = require('express');
const router = express.Router();
const tipo_contratoController = require('../controllers/tipo_contratoController');

// POST /create
router.post('/create', tipo_contratoController.createTipo_contrato);

// GET /tipo_contrato
router.get('/', tipo_contratoController.getAllTipo_contrato);

// PUT /update
router.put('/update', tipo_contratoController.updateTipo_contrato);

// DELETE /delete/:id
router.delete('/delete/:id', tipo_contratoController.deleteTipo_contrato);

module.exports = router;