const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController');

// Ruta para crear una nueva marca
router.post('/create', marcaController.createMarca);

// Ruta para obtener todas las marcas
router.get('/', marcaController.getAllMarca);

// Ruta para actualizar una marca
router.put('/update', marcaController.updateMarca);

// Ruta para eliminar una marca por su ID
router.delete('/delete/:id', marcaController.deleteMarca);

module.exports = router;
