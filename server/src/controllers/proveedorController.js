const db = require('../config/db');

// Función para crear un nuevo proveedor
const createProveedor = (req, res) => {
    const { id_entidad, id_categoria_proveedor } = req.body;
    db.query(
        'INSERT INTO proveedor (id_entidad, id_categoria_proveedor) VALUES (?, ?)',
        [id_entidad, id_categoria_proveedor],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear proveedor');
            }
            res.send(result);
        }
    );
};

// Función para obtener el listado de proveedores con información extendida
const getAllProveedor = (req, res) => {
    const query = `
        SELECT 
            prov.id,
            ent.numero_documento,
            ent.nombre,
            ent.apellido,
            ent.direccion,
            ent.foto,
            pa.documento AS tipo_documento,
            cp.nombre AS categoria_proveedor_nombre
        FROM proveedor prov
        INNER JOIN entidad ent ON prov.id_entidad = ent.id
        INNER JOIN pais pa ON ent.id_pais = pa.id
        INNER JOIN categoria_proveedor cp ON prov.id_categoria_proveedor = cp.id
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener proveedores');
        }
        res.send(result);
    });
};

// Función para actualizar un proveedor
const updateProveedor = (req, res) => {
    const { id, id_entidad, id_categoria_proveedor } = req.body;
    db.query(
        'UPDATE proveedor SET id_entidad = ?, id_categoria_proveedor = ? WHERE id = ?',
        [id_entidad, id_categoria_proveedor, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar proveedor');
            }
            res.send(result);
        }
    );
};

// Función para eliminar un proveedor
const deleteProveedor = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM proveedor WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar proveedor'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Proveedor eliminado'
        });
    });
};

module.exports = {
    createProveedor,
    getAllProveedor,
    updateProveedor,
    deleteProveedor
};
