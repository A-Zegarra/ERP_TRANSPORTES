const express = require('express');
const router = express.Router();
const categoriaProveedorController = require('../controllers/categoriaProveedorController');

// POST /create
router.post('/create', categoriaProveedorController.createCategoriaProveedor);

// GET /categoria
router.get('/', categoriaProveedorController.getAllCategoriaProveedor);

// PUT /update
router.put('/update', categoriaProveedorController.updateCategoriaProveedor);

// DELETE /delete/:id
router.delete('/delete/:id', categoriaProveedorController.deleteCategoriaProveedor);

module.exports = router;
