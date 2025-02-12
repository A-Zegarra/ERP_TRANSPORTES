// server/routes/tipo_personalRoutes.js
const express = require('express');
const router = express.Router();
const tipo_personalController = require('../controllers/tipo_personalController');

// POST /create
router.post('/create', tipo_personalController.createTipo_personal);

// GET /tipo_personal
router.get('/', tipo_personalController.getAllTipo_personal);

// PUT /update
router.put('/update', tipo_personalController.updateTipo_personal);

// DELETE /delete/:id
router.delete('/delete/:id', tipo_personalController.deleteTipo_personal);

module.exports = router;