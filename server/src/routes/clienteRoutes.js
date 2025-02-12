const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Ruta para crear un nuevo registro de cliente
router.post('/create', clienteController.createCliente);

// Ruta para obtener el listado completo de clientes con información extendida
router.get('/', clienteController.getAllCliente);

// Ruta para actualizar un registro de cliente
router.put('/update', clienteController.updateCliente);

// Ruta para eliminar un registro de cliente por su ID
router.delete('/delete/:id', clienteController.deleteCliente);

module.exports = router;
