const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');

// Ruta para crear un nuevo archivo
router.post('/create', archivoController.createArchivo);

// Ruta para obtener el listado completo de archivos
router.get('/', archivoController.getAllArchivo);

// Ruta para actualizar un archivo
router.put('/update', archivoController.updateArchivo);

// Ruta para eliminar un archivo por su ID
router.delete('/delete/:id', archivoController.deleteArchivo);

module.exports = router;
