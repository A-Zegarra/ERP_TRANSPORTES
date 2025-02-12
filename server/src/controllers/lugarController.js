const db = require('../config/db');

// Función para crear un nuevo lugar
const createLugar = (req, res) => {
    const { nombre, direccion, id_pais } = req.body;
    const query = 'INSERT INTO lugar (nombre, direccion, id_pais) VALUES (?, ?, ?)';
    db.query(query, [nombre, direccion, id_pais], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear lugar');
        }
        res.send(result);
    });
};

// Función para obtener todos los lugares
const getAllLugar = (req, res) => {
    const query = 'SELECT * FROM lugar';
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener lugares');
        }
        res.send(result);
    });
};

// Función para actualizar un lugar
const updateLugar = (req, res) => {
    const { id, nombre, direccion, id_pais } = req.body;
    const query = 'UPDATE lugar SET nombre = ?, direccion = ?, id_pais = ? WHERE id = ?';
    db.query(query, [nombre, direccion, id_pais, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar lugar');
        }
        res.send(result);
    });
};

// Función para eliminar un lugar
const deleteLugar = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM lugar WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar lugar');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Lugar no encontrado');
        }
        res.send({ success: true, message: 'Lugar eliminado' });
    });
};

module.exports = {
    createLugar,
    getAllLugar,
    updateLugar,
    deleteLugar
};
