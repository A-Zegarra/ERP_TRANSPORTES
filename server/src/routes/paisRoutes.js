// server/routes/tipo_contratoRoutes.js
const express = require('express');
const router = express.Router();
const paisController = require('../controllers/paisController');

// POST /create
router.post('/create', paisController.createPais);

// GET /tipo_contrato
router.get('/', paisController.getAllPais);

// PUT /update
router.put('/update', paisController.updatePais);

// DELETE /delete/:id
router.delete('/delete/:id', paisController.deletePais);

module.exports = router;