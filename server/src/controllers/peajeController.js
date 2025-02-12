const db = require('../config/db');

// Función para crear un nuevo registro en la tabla peaje
const createPeaje = (req, res) => {
    const { id_pais, nombre, ejes, costo, ubicacion_gps } = req.body;
    const query = 'INSERT INTO peaje (id_pais, nombre, ejes, costo, ubicacion_gps) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [id_pais, nombre, ejes, costo, ubicacion_gps], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear peaje');
        }
        res.send(result);
    });
};

// Función para obtener todos los registros de la tabla peaje
const getAllPeaje = (req, res) => {
    const query = 'SELECT * FROM peaje';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener peajes');
        }
        res.send(results);
    });
};

// Función para actualizar un registro en la tabla peaje
const updatePeaje = (req, res) => {
    const { id, id_pais, nombre, ejes, costo, ubicacion_gps } = req.body;
    const query = 'UPDATE peaje SET id_pais = ?, nombre = ?, ejes = ?, costo = ?, ubicacion_gps = ? WHERE id = ?';
    db.query(query, [id_pais, nombre, ejes, costo, ubicacion_gps, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar peaje');
        }
        res.send(result);
    });
};

// Función para eliminar un registro de la tabla peaje
const deletePeaje = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM peaje WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar peaje');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Peaje no encontrado');
        }
        res.send({ success: true, message: 'Peaje eliminado' });
    });
};

module.exports = {
    createPeaje,
    getAllPeaje,
    updatePeaje,
    deletePeaje
};
