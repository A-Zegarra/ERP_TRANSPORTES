const express = require('express');
const router = express.Router();
const tarifaController = require('../controllers/tarifaController');

// Ruta para crear una nueva tarifa
router.post('/create', tarifaController.createTarifa);

// Ruta para obtener todas las tarifas
router.get('/', tarifaController.getAllTarifa);

// Ruta para actualizar una tarifa
router.put('/update', tarifaController.updateTarifa);

// Ruta para eliminar una tarifa por su ID
router.delete('/delete/:id', tarifaController.deleteTarifa);

module.exports = router;
