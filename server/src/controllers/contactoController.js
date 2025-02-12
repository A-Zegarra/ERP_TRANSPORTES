const db = require('../config/db');

// Función para crear un nuevo contacto
const createContacto = (req, res) => {
    const { id_entidad, nombre, mail, telefono } = req.body;
    db.query(
        'INSERT INTO contacto (id_entidad, nombre, mail, telefono) VALUES (?, ?, ?, ?)',
        [id_entidad, nombre, mail, telefono],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear contacto');
            }
            res.send(result);
        }
    );
};

// Función para obtener el listado de contactos
const getAllContacto = (req, res) => {
    db.query('SELECT * FROM contacto', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al obtener contactos');
        }
        res.send(result);
    });
};

// Función para actualizar un contacto
const updateContacto = (req, res) => {
    const { id, id_entidad, nombre, mail, telefono } = req.body;
    db.query(
        'UPDATE contacto SET id_entidad = ?, nombre = ?, mail = ?, telefono = ? WHERE id = ?',
        [id_entidad, nombre, mail, telefono, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al actualizar contacto');
            }
            res.send(result);
        }
    );
};

// Función para eliminar un contacto
const deleteContacto = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM contacto WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar contacto'
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Contacto eliminado'
        });
    });
};

module.exports = {
    createContacto,
    getAllContacto,
    updateContacto,
    deleteContacto
};
