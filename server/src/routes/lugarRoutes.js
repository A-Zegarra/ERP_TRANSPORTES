const express = require('express');
const router = express.Router();
const lugarController = require('../controllers/lugarController');

// Ruta para crear un nuevo lugar
router.post('/create', lugarController.createLugar);

// Ruta para obtener todos los lugares
router.get('/', lugarController.getAllLugar);

// Ruta para actualizar un lugar
router.put('/update', lugarController.updateLugar);

// Ruta para eliminar un lugar por su ID
router.delete('/delete/:id', lugarController.deleteLugar);

module.exports = router;
