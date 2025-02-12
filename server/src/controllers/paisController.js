const db = require('../config/db');

const createPais = (req, res) => {
    const { nombre, iso_nombre, moneda, iso_moneda, documento, descripcion_documento } = req.body;
    db.query(
        'INSERT INTO pais (nombre, iso_nombre, moneda, iso_moneda, documento, descripcion_documento) VALUES (?,?,?,?,?,?)',
        [nombre, iso_nombre, moneda, iso_moneda, documento, descripcion_documento],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear');
            }
            res.send(result);
        }
    );
};

const getAllPais = (req, res) => {
    db.query('SELECT * FROM pais', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener pais');
        }
        res.send(result);
    });
};

const updatePais = (req, res) => {
    const { id, nombre, iso_nombre, moneda, iso_moneda, documento, descripcion_documento } = req.body;
    db.query(
        'UPDATE pais SET nombre=?, iso_nombre=?,  moneda=?,  iso_moneda=?, documento=?, descripcion_documento=?WHERE id=?',
        [id, nombre, iso_nombre, moneda, iso_moneda, documento, descripcion_documento],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar');
            }
            res.send(result);
        }
    );
};

const deletePais = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM pais WHERE id=?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar pais'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pais no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Pais eliminado'
        });
    });
};

module.exports = {
    createPais,
    getAllPais,
    updatePais,
    deletePais
};
