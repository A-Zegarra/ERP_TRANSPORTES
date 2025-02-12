const db = require('../config/db');

// Función para crear un nuevo registro en la tabla tarifa
const createTarifa = (req, res) => {
  const { id_ruta, monto, fecha_inicio, fecha_fin } = req.body;
  const query = `
    INSERT INTO tarifa (id_ruta, monto, fecha_inicio, fecha_fin)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [id_ruta, monto, fecha_inicio, fecha_fin], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al crear tarifa');
    }
    res.send(result);
  });
};

// Función para obtener todos los registros de la tabla tarifa
const getAllTarifa = (req, res) => {
  const query = 'SELECT * FROM tarifa';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener tarifas');
    }
    res.send(results);
  });
};

// Función para actualizar un registro en la tabla tarifa
const updateTarifa = (req, res) => {
  const { id, id_ruta, monto, fecha_inicio, fecha_fin } = req.body;
  const query = `
    UPDATE tarifa
    SET id_ruta = ?, monto = ?, fecha_inicio = ?, fecha_fin = ?
    WHERE id = ?
  `;
  db.query(query, [id_ruta, monto, fecha_inicio, fecha_fin, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar tarifa');
    }
    res.send(result);
  });
};

// Función para eliminar un registro de la tabla tarifa
const deleteTarifa = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM tarifa WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al eliminar tarifa');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Tarifa no encontrada');
    }
    res.send({ success: true, message: 'Tarifa eliminada' });
  });
};

module.exports = {
  createTarifa,
  getAllTarifa,
  updateTarifa,
  deleteTarifa
};
