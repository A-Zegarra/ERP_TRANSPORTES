const db = require('../config/db');

// Función para crear una nueva entidad
const createEntidad = (req, res) => {
  const { id_pais, numero_documento, razon_social, nombre, apellido, direccion, foto } = req.body;
  const query = `
    INSERT INTO entidad (id_pais, numero_documento, razon_social, nombre, apellido, direccion, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [id_pais, numero_documento, razon_social, nombre, apellido, direccion, foto], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al crear entidad');
    }
    res.send(result);
  });
};

// Función para obtener todas las entidades
const getAllEntidad = (req, res) => {
  const query = 'SELECT * FROM entidad';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener entidades');
    }
    res.send(results);
  });
};

// Función para actualizar una entidad
const updateEntidad = (req, res) => {
  const { id, id_pais, numero_documento, razon_social, nombre, apellido, direccion, foto } = req.body;
  const query = `
    UPDATE entidad
    SET id_pais = ?, numero_documento = ?, razon_social = ?, nombre = ?, apellido = ?, direccion = ?, foto = ?
    WHERE id = ?
  `;
  db.query(query, [id_pais, numero_documento, razon_social, nombre, apellido, direccion, foto, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar entidad');
    }
    res.send(result);
  });
};

// Función para eliminar una entidad
const deleteEntidad = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM entidad WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al eliminar entidad');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Entidad no encontrada');
    }
    res.send({ success: true, message: 'Entidad eliminada' });
  });
};

module.exports = {
  createEntidad,
  getAllEntidad,
  updateEntidad,
  deleteEntidad
};
