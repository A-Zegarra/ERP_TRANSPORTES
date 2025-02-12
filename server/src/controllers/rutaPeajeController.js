const db = require('../config/db');

// Función para crear un nuevo registro en la tabla ruta_peaje
const createRutaPeaje = (req, res) => {
    const { id_ruta, id_peaje } = req.body;
    const query = 'INSERT INTO ruta_peaje (id_ruta, id_peaje) VALUES (?, ?)';
    db.query(query, [id_ruta, id_peaje], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear ruta peaje');
        }
        res.send(result);
    });
};

// Función para obtener todos los registros de la tabla ruta_peaje
const getAllRutaPeaje = (req, res) => {
    const query = 'SELECT * FROM ruta_peaje';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener rutas peaje');
        }
        res.send(results);
    });
};

// Función para actualizar un registro en la tabla ruta_peaje
const updateRutaPeaje = (req, res) => {
    const { id, id_ruta, id_peaje } = req.body;
    const query = 'UPDATE ruta_peaje SET id_ruta = ?, id_peaje = ? WHERE id = ?';
    db.query(query, [id_ruta, id_peaje, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar ruta peaje');
        }
        res.send(result);
    });
};

// Función para eliminar un registro de la tabla ruta_peaje
const deleteRutaPeaje = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM ruta_peaje WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar ruta peaje');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Ruta peaje no encontrada');
        }
        res.send({ success: true, message: 'Ruta peaje eliminada' });
    });
};

module.exports = {
    createRutaPeaje,
    getAllRutaPeaje,
    updateRutaPeaje,
    deleteRutaPeaje
};
