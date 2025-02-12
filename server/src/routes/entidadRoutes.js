const express = require('express');
const router = express.Router();
const entidadController = require('../controllers/entidadController');

// Ruta para crear una nueva entidad
router.post('/create', entidadController.createEntidad);

// Ruta para obtener todas las entidades
router.get('/', entidadController.getAllEntidad);

// Ruta para actualizar una entidad
router.put('/update', entidadController.updateEntidad);

// Ruta para eliminar una entidad por su ID
router.delete('/delete/:id', entidadController.deleteEntidad);

module.exports = router;
