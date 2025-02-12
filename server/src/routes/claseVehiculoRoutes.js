const express = require('express');
const router = express.Router();
const claseVehiculoController = require('../controllers/claseVehiculoController');

// Ruta para crear una nueva clase de vehículo
router.post('/create', claseVehiculoController.createClaseVehiculo);

// Ruta para obtener todas las clases de vehículos
router.get('/', claseVehiculoController.getAllClaseVehiculo);

// Ruta para actualizar una clase de vehículo
router.put('/update', claseVehiculoController.updateClaseVehiculo);

// Ruta para eliminar una clase de vehículo por su ID
router.delete('/delete/:id', claseVehiculoController.deleteClaseVehiculo);

module.exports = router;
