const db = require('../config/db');

// Función para crear un nuevo registro en la tabla personal
const createPersonal = (req, res) => {
    const { id_entidad, id_tipo_personal, id_tipo_contrato } = req.body;
    db.query(
        'INSERT INTO personal (id_entidad, id_tipo_personal, id_tipo_contrato) VALUES (?, ?, ?)',
        [id_entidad, id_tipo_personal, id_tipo_contrato],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear personal');
            }
            res.send(result);
        }
    );
};

// Función para obtener el listado de personal con la información extendida
const getAllPersonal = (req, res) => {
    const query = `
        SELECT 
            per.id,
            per.estado,
            ent.numero_documento,
            ent.nombre,
            ent.apellido,
            ent.direccion,
            ent.foto,
            ent.telefono,
            ent.correo,
            pa.documento AS tipo_documento,
            tp.nombre AS tipo_personal_nombre,
            tc.nombre AS tipo_contrato_nombre
        FROM personal per
        INNER JOIN entidad ent ON per.id_entidad = ent.id
        INNER JOIN pais pa ON ent.id_pais = pa.id
        INNER JOIN tipo_personal tp ON per.id_tipo_personal = tp.id
        INNER JOIN tipo_contrato tc ON per.id_tipo_contrato = tc.id
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener personal');
        }
        res.send(result);
    });
};

// Función para actualizar un registro en la tabla personal
const updatePersonal = (req, res) => {
    const { id, id_entidad, id_tipo_personal, id_tipo_contrato } = req.body;
    db.query(
        'UPDATE personal SET id_entidad = ?, id_tipo_personal = ?, id_tipo_contrato = ? WHERE id = ?',
        [id_entidad, id_tipo_personal, id_tipo_contrato, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar personal');
            }
            res.send(result);
        }
    );
};

// Función para eliminar un registro de la tabla personal
const deletePersonal = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM personal WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar personal'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Personal eliminado'
        });
    });
};

module.exports = {
    createPersonal,
    getAllPersonal,
    updatePersonal,
    deletePersonal
};
