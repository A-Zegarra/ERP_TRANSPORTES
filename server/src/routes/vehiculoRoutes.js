const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');

// Ruta para crear un nuevo vehiculo
router.post('/create', vehiculoController.createVehiculo);

// Ruta para obtener todos los vehiculos
router.get('/', vehiculoController.getAllVehiculo);

// Ruta para actualizar un vehiculo
router.put('/update', vehiculoController.updateVehiculo);

// Ruta para eliminar un vehiculo por su ID
router.delete('/delete/:id', vehiculoController.deleteVehiculo);

module.exports = router;
