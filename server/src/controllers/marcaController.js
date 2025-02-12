const db = require('../config/db');

// Función para crear una nueva marca
const createMarca = (req, res) => {
    const { nombre } = req.body;
    const query = 'INSERT INTO marca (nombre) VALUES (?)';
    db.query(query, [nombre], (err, result) => {
        if (err) {
            console.error(err);
            // Si se produce un error, por ejemplo, por violar la restricción UNIQUE, se devuelve un error 500.
            return res.status(500).send('Error al crear marca');
        }
        res.send(result);
    });
};

// Función para obtener todas las marcas
const getAllMarca = (req, res) => {
    const query = 'SELECT * FROM marca';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener marcas');
        }
        res.send(results);
    });
};

// Función para actualizar una marca existente
const updateMarca = (req, res) => {
    const { id, nombre } = req.body;
    const query = 'UPDATE marca SET nombre = ? WHERE id = ?';
    db.query(query, [nombre, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar marca');
        }
        res.send(result);
    });
};

// Función para eliminar una marca
const deleteMarca = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM marca WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al eliminar marca');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Marca no encontrada');
        }
        res.send({ success: true, message: 'Marca eliminada' });
    });
};

module.exports = {
    createMarca,
    getAllMarca,
    updateMarca,
    deleteMarca
};
