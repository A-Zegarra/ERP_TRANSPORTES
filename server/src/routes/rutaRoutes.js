const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/rutaController');

// Ruta para crear un nuevo registro en la tabla ruta
router.post('/create', rutaController.createRuta);

// Ruta para obtener todos los registros de la tabla ruta
router.get('/', rutaController.getAllRuta);

// Ruta para actualizar un registro en la tabla ruta
router.put('/update', rutaController.updateRuta);

// Ruta para eliminar un registro de la tabla ruta por su ID
router.delete('/delete/:id', rutaController.deleteRuta);

module.exports = router;
