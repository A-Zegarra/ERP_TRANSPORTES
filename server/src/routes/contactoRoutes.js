const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');

// Ruta para crear un nuevo contacto
router.post('/create', contactoController.createContacto);

// Ruta para obtener el listado de contactos
router.get('/', contactoController.getAllContacto);

// Ruta para actualizar un contacto
router.put('/update', contactoController.updateContacto);

// Ruta para eliminar un contacto por su ID
router.delete('/delete/:id', contactoController.deleteContacto);

module.exports = router;
