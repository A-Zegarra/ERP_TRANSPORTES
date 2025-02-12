const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');

// Ruta para crear un servicio
router.post('/create', servicioController.createServicio);

// Ruta para obtener todos los servicios
router.get('/', servicioController.getAllServicio);

// Ruta para actualizar un servicio
router.put('/update', servicioController.updateServicio);

// Ruta para eliminar un servicio por ID
router.delete('/delete/:id', servicioController.deleteServicio);

module.exports = router;
