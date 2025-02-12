const db = require('../config/db');

// Función para crear un nuevo modelo
const createModelo = (req, res) => {
    const { id_marca, nombre, codigo, generacion } = req.body;
    const query = `
        INSERT INTO modelo (id_marca, nombre, codigo, generacion)
        VALUES (?, ?, ?, ?)
    `;
    db.query(query, [id_marca, nombre, codigo, generacion], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear el modelo');
        }
        res.send(result);
    });
};

// Función para obtener todos los modelos
const getAllModelo = (req, res) => {
    const query = 'SELECT * FROM modelo';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener los modelos');
        }
        res.send(results);
    });
};

// Función para actualizar un modelo existente
const updateModelo = (req, res) => {
    const { id, id_marca, nombre, codigo, generacion } = req.body;
    const query = `
        UPDATE modelo
        SET id_marca = ?, nombre = ?, codigo = ?, generacion = ?
        WHERE id = ?
    `;
    db.query(query, [id_marca, nombre, codigo, generacion, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar el modelo');
        }
        res.send(result);
    });
};

// Función para eliminar un modelo
const deleteModelo = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM modelo WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar el modelo');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Modelo no encontrado');
        }
        res.send({ success: true, message: 'Modelo eliminado' });
    });
};

module.exports = {
    createModelo,
    getAllModelo,
    updateModelo,
    deleteModelo
};
