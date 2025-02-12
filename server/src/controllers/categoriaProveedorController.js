const db = require('../config/db');

const createCategoriaProveedor = (req, res) => {
    const { nombre, descripcion } = req.body;
    db.query(
        'INSERT INTO categoria_proveedor (nombre, descripcion) VALUES (?, ?)',
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

const getAllCategoriaProveedor = (req, res) => {
    db.query('SELECT * FROM categoria_proveedor', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener categorías');
        }
        res.send(result);
    });
};

const updateCategoriaProveedor = (req, res) => {
    const { id, nombre, descripcion } = req.body;
    db.query(
        'UPDATE categoria_proveedor SET nombre = ?, descripcion = ? WHERE id = ?',
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

const deleteCategoriaProveedor = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM categoria_proveedor WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar categoría'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
        res.json({
            success: true,
            message: 'Categoría eliminada'
        });
    });
};

module.exports = {
    createCategoriaProveedor,
    getAllCategoriaProveedor,
    updateCategoriaProveedor,
    deleteCategoriaProveedor
};
