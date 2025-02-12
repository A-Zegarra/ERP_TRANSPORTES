const express = require('express');
const router = express.Router();
const viaticosController = require('../controllers/viaticosController');

// Ruta para crear un nuevo viático
router.post('/create', viaticosController.createViatico);

// Ruta para obtener todos los viáticos
router.get('/', viaticosController.getAllViaticos);

// Ruta para actualizar un viático
router.put('/update', viaticosController.updateViatico);

// Ruta para eliminar un viático por su ID
router.delete('/delete/:id', viaticosController.deleteViatico);

module.exports = router;
