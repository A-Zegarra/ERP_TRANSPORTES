const db = require('../config/db');

// Función para crear una nueva clase de vehículo
const createClaseVehiculo = (req, res) => {
    const { nombre, descripcion } = req.body;
    const query = 'INSERT INTO clase_vehiculo (nombre, descripcion) VALUES (?, ?)';
    db.query(query, [nombre, descripcion], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear la clase de vehículo');
        }
        res.send(result);
    });
};

// Función para obtener todas las clases de vehículos
const getAllClaseVehiculo = (req, res) => {
    const query = 'SELECT * FROM clase_vehiculo';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener las clases de vehículos');
        }
        res.send(results);
    });
};

// Función para actualizar una clase de vehículo
const updateClaseVehiculo = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    const query = 'UPDATE clase_vehiculo SET nombre = ?, descripcion = ? WHERE id = ?';
    db.query(query, [nombre, descripcion, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar la clase de vehículo');
        }
        res.send(result);
    });
};

// Función para eliminar una clase de vehículo
const deleteClaseVehiculo = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM clase_vehiculo WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar la clase de vehículo');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Clase de vehículo no encontrada');
        }
        res.send({ success: true, message: 'Clase de vehículo eliminada' });
    });
};

module.exports = {
    createClaseVehiculo,
    getAllClaseVehiculo,
    updateClaseVehiculo,
    deleteClaseVehiculo
};

