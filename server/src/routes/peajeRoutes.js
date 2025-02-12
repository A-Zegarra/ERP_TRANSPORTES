const express = require('express');
const router = express.Router();
const peajeController = require('../controllers/peajeController');

// Ruta para crear un nuevo registro en la tabla peaje
router.post('/create', peajeController.createPeaje);

// Ruta para obtener todos los registros de la tabla peaje
router.get('/', peajeController.getAllPeaje);

// Ruta para actualizar un registro de la tabla peaje
router.put('/update', peajeController.updatePeaje);

// Ruta para eliminar un registro de la tabla peaje por su ID
router.delete('/delete/:id', peajeController.deletePeaje);

module.exports = router;
