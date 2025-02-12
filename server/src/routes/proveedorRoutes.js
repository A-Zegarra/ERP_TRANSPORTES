const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

// Ruta para crear un nuevo proveedor
router.post('/create', proveedorController.createProveedor);

// Ruta para obtener el listado completo de proveedores con información extendida
router.get('/', proveedorController.getAllProveedor);

// Ruta para actualizar un proveedor
router.put('/update', proveedorController.updateProveedor);

// Ruta para eliminar un proveedor por su ID
router.delete('/delete/:id', proveedorController.deleteProveedor);

module.exports = router;
