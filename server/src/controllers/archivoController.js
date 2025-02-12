const db = require('../config/db');

// Función para crear un nuevo archivos
const createArchivo = (req, res) => {
    const { id_entidad, nombre, tipo_archivos, ruta_archivos } = req.body;
    // La columna fecha_subida se asigna automáticamente con CURRENT_TIMESTAMP
    db.query(
        'INSERT INTO archivos (id_entidad, nombre, tipo_archivos, ruta_archivos) VALUES (?, ?, ?, ?)',
        [id_entidad, nombre, tipo_archivos, ruta_archivos],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear archivos');
            }
            res.send(result);
        }
    );
};

// Función para obtener el listado de archivoss
const getAllArchivo = (req, res) => {
    db.query('SELECT * FROM archivos', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener archivoss');
        }
        res.send(result);
    });
};

// Función para actualizar un archivos
const updateArchivo = (req, res) => {
    const { id, id_entidad, nombre, tipo_archivos, ruta_archivos } = req.body;
    db.query(
        'UPDATE archivos SET id_entidad = ?, nombre = ?, tipo_archivos = ?, ruta_archivos = ? WHERE id = ?',
        [id_entidad, nombre, tipo_archivos, ruta_archivos, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar archivos');
            }
            res.send(result);
        }
    );
};

// Función para eliminar un archivos
const deleteArchivo = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM archivos WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar archivos'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Archivo eliminado'
        });
    });
};

module.exports = {
    createArchivo,
    getAllArchivo,
    updateArchivo,
    deleteArchivo
};
