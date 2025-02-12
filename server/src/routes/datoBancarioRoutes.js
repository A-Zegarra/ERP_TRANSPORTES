const express = require('express');
const router = express.Router();
const datoBancarioController = require('../controllers/datoBancarioController');

// Ruta para crear un nuevo dato bancario
router.post('/create', datoBancarioController.createDatoBancario);

// Ruta para obtener el listado de datos bancarios
router.get('/', datoBancarioController.getAllDatoBancario);

// Ruta para actualizar un dato bancario
router.put('/update', datoBancarioController.updateDatoBancario);

// Ruta para eliminar un dato bancario por su ID
router.delete('/delete/:id', datoBancarioController.deleteDatoBancario);

module.exports = router;
