const express = require('express');
const router = express.Router();
const rutaPeajeController = require('../controllers/rutaPeajeController');

// Ruta para crear un nuevo registro en la tabla ruta_peaje
router.post('/create', rutaPeajeController.createRutaPeaje);

// Ruta para obtener todos los registros de la tabla ruta_peaje
router.get('/', rutaPeajeController.getAllRutaPeaje);

// Ruta para actualizar un registro de la tabla ruta_peaje
router.put('/update', rutaPeajeController.updateRutaPeaje);

// Ruta para eliminar un registro de la tabla ruta_peaje por su ID
router.delete('/delete/:id', rutaPeajeController.deleteRutaPeaje);

module.exports = router;
