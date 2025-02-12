const db = require('../config/db');

const createTipo_contrato = (req, res) => {
    const { nombre, descripcion } = req.body;
    db.query(
        'INSERT INTO tipo_contrato (nombre, descripcion) VALUES (?,?)',
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

const getAllTipo_contrato = (req, res) => {
    db.query('SELECT * FROM tipo_contrato', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener tipo_contrato');
        }
        res.send(result);
    });
};

const updateTipo_contrato = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    db.query(
        'UPDATE tipo_contrato SET nombre=?, descripcion=? WHERE id=?',
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

const deleteTipo_contrato = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tipo_contrato WHERE id=?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar tipo de contrato'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de contrato no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Tipo de contrato eliminado'
        });
    });
};

module.exports = {
    createTipo_contrato,
    getAllTipo_contrato,
    updateTipo_contrato,
    deleteTipo_contrato
};
