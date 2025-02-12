const db = require('../config/db');

// Función para crear un nuevo registro en la tabla cliente
const createCliente = (req, res) => {
    const { id_entidad } = req.body;
    db.query(
        'INSERT INTO cliente (id_entidad) VALUES (?)',
        [id_entidad],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear cliente');
            }
            res.send(result);
        }
    );
};

// Función para obtener el listado de clientes con la información extendida
const getAllCliente = (req, res) => {
    const query = `
        SELECT 
            cl.id,
            ent.numero_documento,
            ent.nombre,
            ent.apellido,
            ent.direccion,
            ent.foto,
            pa.documento AS tipo_documento
        FROM cliente cl
        INNER JOIN entidad ent ON cl.id_entidad = ent.id
        INNER JOIN pais pa ON ent.id_pais = pa.id
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener clientes');
        }
        res.send(result);
    });
};

// Función para actualizar un registro en la tabla cliente
const updateCliente = (req, res) => {
    const { id, id_entidad } = req.body;
    db.query(
        'UPDATE cliente SET id_entidad = ? WHERE id = ?',
        [id_entidad, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar cliente');
            }
            res.send(result);
        }
    );
};

// Función para eliminar un registro de la tabla cliente
const deleteCliente = (req, res) => {
    const { id } = req.params;
    db.query(
        'DELETE FROM cliente WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al eliminar cliente'
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }
            res.json({
                success: true,
                message: 'Cliente eliminado'
            });
        }
    );
};

module.exports = {
    createCliente,
    getAllCliente,
    updateCliente,
    deleteCliente
};
