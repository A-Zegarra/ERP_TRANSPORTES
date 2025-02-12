const db = require('../config/db');

// Función para crear un nuevo viático
const createViatico = (req, res) => {
  const { id_personal, id_ruta, descripcion, monto, fecha } = req.body;
  const query = `
    INSERT INTO viaticos (id_personal, id_ruta, descripcion, monto, fecha)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [id_personal, id_ruta, descripcion, monto, fecha], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al crear viático');
    }
    res.send(result);
  });
};

// Función para obtener todos los viáticos
const getAllViaticos = (req, res) => {
  const query = 'SELECT * FROM viaticos';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener viáticos');
    }
    res.send(results);
  });
};

// Función para actualizar un viático
const updateViatico = (req, res) => {
  const { id, id_personal, id_ruta, descripcion, monto, fecha } = req.body;
  const query = `
    UPDATE viaticos
    SET id_personal = ?, id_ruta = ?, descripcion = ?, monto = ?, fecha = ?
    WHERE id = ?
  `;
  db.query(query, [id_personal, id_ruta, descripcion, monto, fecha, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al actualizar viático');
    }
    res.send(result);
  });
};

// Función para eliminar un viático
const deleteViatico = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM viaticos WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al eliminar viático');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Viático no encontrado');
    }
    res.send({ success: true, message: 'Viático eliminado' });
  });
};

module.exports = {
  createViatico,
  getAllViaticos,
  updateViatico,
  deleteViatico
};
