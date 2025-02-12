const express = require('express');
const router = express.Router();
const modeloController = require('../controllers/modeloController');

// Ruta para crear un nuevo modelo
router.post('/create', modeloController.createModelo);

// Ruta para obtener todos los modelos
router.get('/', modeloController.getAllModelo);

// Ruta para actualizar un modelo
router.put('/update', modeloController.updateModelo);

// Ruta para eliminar un modelo por su ID
router.delete('/delete/:id', modeloController.deleteModelo);

module.exports = router;
