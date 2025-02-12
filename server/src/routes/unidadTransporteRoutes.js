const express = require('express');
const router = express.Router();
const unidadTransporteController = require('../controllers/unidadTransporteController');

// Ruta para crear una nueva unidad de transporte
router.post('/create', unidadTransporteController.createUnidadTransporte);

// Ruta para obtener todas las unidades de transporte
router.get('/', unidadTransporteController.getAllUnidadTransporte);

// Ruta para actualizar una unidad de transporte
router.put('/update', unidadTransporteController.updateUnidadTransporte);

// Ruta para eliminar una unidad de transporte por su ID
router.delete('/delete/:id', unidadTransporteController.deleteUnidadTransporte);

module.exports = router;
