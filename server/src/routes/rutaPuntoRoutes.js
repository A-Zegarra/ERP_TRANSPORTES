const express = require('express');
const router = express.Router();
const rutaPuntoController = require('../controllers/rutaPuntoController');

// Ruta para crear un nuevo registro en la tabla ruta_punto
router.post('/create', rutaPuntoController.createRutaPunto);

// Ruta para obtener todos los registros de la tabla ruta_punto
router.get('/', rutaPuntoController.getAllRutaPunto);

// Ruta para actualizar un registro de la tabla ruta_punto
router.put('/update', rutaPuntoController.updateRutaPunto);

// Ruta para eliminar un registro de la tabla ruta_punto por su ID
router.delete('/delete/:id', rutaPuntoController.deleteRutaPunto);

module.exports = router;
