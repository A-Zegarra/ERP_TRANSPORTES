const db = require('../config/db');

const createServicio = (req, res) => {
    const { nombre, descripcion } = req.body;
    db.query(
        'INSERT INTO servicio (nombre, descripcion) VALUES (?, ?)',
        [nombre, descripcion],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear servicio');
            }
            res.send(result);
        }
    );
};

const getAllServicio = (req, res) => {
    db.query('SELECT * FROM servicio', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener servicios');
        }
        res.send(result);
    });
};

const updateServicio = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    db.query(
        'UPDATE servicio SET nombre = ?, descripcion = ? WHERE id = ?',
        [nombre, descripcion, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar servicio');
            }
            res.send(result);
        }
    );
};

const deleteServicio = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM servicio WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar servicio'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Servicio eliminado'
        });
    });
};

module.exports = {
    createServicio,
    getAllServicio,
    updateServicio,
    deleteServicio
};
