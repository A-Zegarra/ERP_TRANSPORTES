// server/controllers/tipo_personalController.js
const db = require('../config/db');

// POST /create
const createTipo_personal = (req, res) => {
    const { nombre, descripcion } = req.body;
    db.query(
        'INSERT INTO tipo_personal (nombre, descripcion) VALUES (?,?)',
        [nombre, descripcion],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear');
            }
            res.send(result);
        }
    );
};

// GET /tipo_personal
const getAllTipo_personal = (req, res) => {
    db.query('SELECT * FROM tipo_personal', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener tipo_personal');
        }
        res.send(result);
    });
};

// PUT /update
const updateTipo_personal = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    db.query(
        'UPDATE tipo_personal SET nombre=?, descripcion=? WHERE id=?',
        [nombre, descripcion, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar');
            }
            res.send(result);
        }
    );
};

// DELETE /delete/:id
// Mejor manejo de errores y respuestas
const deleteTipo_personal = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tipo_personal WHERE id=?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({  // Usar json en lugar de send
                success: false,
                message: 'Error al eliminar tipo de personal'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de personal no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Tipo de personal eliminado'
        });
    });
};

module.exports = {
    createTipo_personal,
    getAllTipo_personal,
    updateTipo_personal,
    deleteTipo_personal
};
