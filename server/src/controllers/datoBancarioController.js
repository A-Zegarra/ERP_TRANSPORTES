const db = require('../config/db');

// Función para crear un nuevo dato bancario
const createDatoBancario = (req, res) => {
    const { id_entidad, nombre, tipo_cuenta, numero_cuenta, cci, detraccion } = req.body;
    const query = `
        INSERT INTO dato_bancario (id_entidad, nombre, tipo_cuenta, numero_cuenta, cci, detraccion)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [id_entidad, nombre, tipo_cuenta, numero_cuenta, cci, detraccion], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al crear dato bancario');
        }
        res.send(result);
    });
};

// Función para obtener todos los datos bancarios
const getAllDatoBancario = (req, res) => {
    const query = 'SELECT * FROM dato_bancario';
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener datos bancarios');
        }
        res.send(result);
    });
};

// Función para actualizar un dato bancario
const updateDatoBancario = (req, res) => {
    const { id, id_entidad, nombre, tipo_cuenta, numero_cuenta, cci, detraccion } = req.body;
    const query = `
        UPDATE dato_bancario
        SET id_entidad = ?, nombre = ?, tipo_cuenta = ?, numero_cuenta = ?, cci = ?, detraccion = ?
        WHERE id = ?
    `;
    db.query(query, [id_entidad, nombre, tipo_cuenta, numero_cuenta, cci, detraccion, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al actualizar dato bancario');
        }
        res.send(result);
    });
};

// Función para eliminar un dato bancario
const deleteDatoBancario = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM dato_bancario WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar dato bancario'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dato bancario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Dato bancario eliminado'
        });
    });
};

module.exports = {
    createDatoBancario,
    getAllDatoBancario,
    updateDatoBancario,
    deleteDatoBancario
};
