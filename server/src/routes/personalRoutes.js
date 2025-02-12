const express = require('express');
const router = express.Router();
const personalController = require('../controllers/personalController');

// Ruta para crear un nuevo registro de personal
router.post('/create', personalController.createPersonal);

// Ruta para obtener el listado completo de personal con información extendida
router.get('/', personalController.getAllPersonal);

// Ruta para actualizar un registro de personal
router.put('/update', personalController.updatePersonal);

// Ruta para eliminar un registro de personal por su ID
router.delete('/delete/:id', personalController.deletePersonal);

module.exports = router;
