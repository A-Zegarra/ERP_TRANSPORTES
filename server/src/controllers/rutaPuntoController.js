const db = require('../config/db');

// Función para crear un nuevo registro en la tabla ruta_punto
const createRutaPunto = (req, res) => {
    const { id_lugar, id_ruta, tipo, fecha } = req.body;
    const query = 'INSERT INTO ruta_punto (id_lugar, id_ruta, tipo, fecha) VALUES (?, ?, ?, ?)';
    db.query(query, [id_lugar, id_ruta, tipo, fecha], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear ruta punto');
        }
        res.send(result);
    });
};

// Función para obtener todos los registros de la tabla ruta_punto
const getAllRutaPunto = (req, res) => {
    const query = 'SELECT * FROM ruta_punto';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener ruta puntos');
        }
        res.send(results);
    });
};

// Función para actualizar un registro de la tabla ruta_punto
const updateRutaPunto = (req, res) => {
    const { id, id_lugar, id_ruta, tipo, fecha } = req.body;
    const query = 'UPDATE ruta_punto SET id_lugar = ?, id_ruta = ?, tipo = ?, fecha = ? WHERE id = ?';
    db.query(query, [id_lugar, id_ruta, tipo, fecha, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar ruta punto');
        }
        res.send(result);
    });
};

// Función para eliminar un registro de la tabla ruta_punto
const deleteRutaPunto = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM ruta_punto WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar ruta punto');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Ruta punto no encontrado');
        }
        res.send({ success: true, message: 'Ruta punto eliminado' });
    });
};

module.exports = {
    createRutaPunto,
    getAllRutaPunto,
    updateRutaPunto,
    deleteRutaPunto
};
