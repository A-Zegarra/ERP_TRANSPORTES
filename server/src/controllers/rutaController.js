const db = require('../config/db');

// Función para crear un nuevo registro en la tabla ruta
const createRuta = (req, res) => {
    const { id_cliente, km_distancia, galones_litros } = req.body;
    const query = 'INSERT INTO ruta (id_cliente, km_distancia, galones_litros) VALUES (?, ?, ?)';
    db.query(query, [id_cliente, km_distancia, galones_litros], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear ruta');
        }
        res.send(result);
    });
};

// Función para obtener todos los registros de la tabla ruta
const getAllRuta = (req, res) => {
    const query = 'SELECT * FROM ruta';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener rutas');
        }
        res.send(results);
    });
};

// Función para actualizar un registro en la tabla ruta
const updateRuta = (req, res) => {
    const { id, id_cliente, km_distancia, galones_litros } = req.body;
    const query = 'UPDATE ruta SET id_cliente = ?, km_distancia = ?, galones_litros = ? WHERE id = ?';
    db.query(query, [id_cliente, km_distancia, galones_litros, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar ruta');
        }
        res.send(result);
    });
};

// Función para eliminar un registro de la tabla ruta
const deleteRuta = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM ruta WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar ruta');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Ruta no encontrada');
        }
        res.send({ success: true, message: 'Ruta eliminada' });
    });
};

module.exports = {
    createRuta,
    getAllRuta,
    updateRuta,
    deleteRuta
};
