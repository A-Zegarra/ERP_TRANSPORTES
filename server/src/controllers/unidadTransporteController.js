const db = require('../config/db');

// Función para crear una nueva unidad de transporte
const createUnidadTransporte = (req, res) => {
    const { nombre, descripcion } = req.body;
    const query = 'INSERT INTO unidad_transporte (nombre, descripcion) VALUES (?, ?)';
    db.query(query, [nombre, descripcion], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear la unidad de transporte');
        }
        res.send(result);
    });
};

// Función para obtener todas las unidades de transporte
const getAllUnidadTransporte = (req, res) => {
    const query = 'SELECT * FROM unidad_transporte';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener las unidades de transporte');
        }
        res.send(results);
    });
};

// Función para actualizar una unidad de transporte
const updateUnidadTransporte = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    const query = 'UPDATE unidad_transporte SET nombre = ?, descripcion = ? WHERE id = ?';
    db.query(query, [nombre, descripcion, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar la unidad de transporte');
        }
        res.send(result);
    });
};

// Función para eliminar una unidad de transporte
const deleteUnidadTransporte = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM unidad_transporte WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar la unidad de transporte');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Unidad de transporte no encontrada');
        }
        res.send({ success: true, message: 'Unidad de transporte eliminada' });
    });
};

module.exports = {
    createUnidadTransporte,
    getAllUnidadTransporte,
    updateUnidadTransporte,
    deleteUnidadTransporte
};
