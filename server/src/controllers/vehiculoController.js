const db = require('../config/db');

// Función para crear un nuevo registro en la tabla vehiculo
const createVehiculo = (req, res) => {
  const {
    estado,                    // ENUM ('Activo','Inactivo'), default 'Activo'
    id_clase_vehiculo,         // FK a clase_vehiculo
    id_unidad_transporte,      // FK a unidad_transporte
    id_marca,                  // FK a marca
    id_proveedor,              // FK a proveedor (puede ser nulo)
    tipo_contratacion,         // varchar(50)
    placa,                     // varchar(20) NOT NULL UNIQUE
    serie_chasis,              // varchar(50) NOT NULL UNIQUE
    capacidad_carga,           // DECIMAL(10,2)
    km_actual,                 // INT
    semiremolque,              // varchar(50)
    compartimientos,           // INT
    carroceria                 // varchar(50)
  } = req.body;

  const query = `
    INSERT INTO vehiculo (
      estado, id_clase_vehiculo, id_unidad_transporte, id_marca, id_proveedor,
      tipo_contratacion, placa, serie_chasis, capacidad_carga, km_actual,
      semiremolque, compartimientos, carroceria
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    query,
    [
      estado, id_clase_vehiculo, id_unidad_transporte, id_marca, id_proveedor,
      tipo_contratacion, placa, serie_chasis, capacidad_carga, km_actual,
      semiremolque, compartimientos, carroceria
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al crear vehiculo');
      }
      res.send(result);
    }
  );
};

// Función para obtener todos los registros de la tabla vehiculo
const getAllVehiculo = (req, res) => {
  const query = 'SELECT * FROM vehiculo';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al obtener vehiculos');
    }
    res.send(results);
  });
};

// Función para actualizar un registro de la tabla vehiculo
const updateVehiculo = (req, res) => {
  const {
    id,
    estado,
    id_clase_vehiculo,
    id_unidad_transporte,
    id_marca,
    id_proveedor,
    tipo_contratacion,
    placa,
    serie_chasis,
    capacidad_carga,
    km_actual,
    semiremolque,
    compartimientos,
    carroceria
  } = req.body;

  const query = `
    UPDATE vehiculo
    SET estado = ?, id_clase_vehiculo = ?, id_unidad_transporte = ?,
        id_marca = ?, id_proveedor = ?, tipo_contratacion = ?,
        placa = ?, serie_chasis = ?, capacidad_carga = ?,
        km_actual = ?, semiremolque = ?, compartimientos = ?, carroceria = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      estado, id_clase_vehiculo, id_unidad_transporte, id_marca, id_proveedor,
      tipo_contratacion, placa, serie_chasis, capacidad_carga, km_actual,
      semiremolque, compartimientos, carroceria, id
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al actualizar vehiculo');
      }
      res.send(result);
    }
  );
};

// Función para eliminar un registro de la tabla vehiculo
const deleteVehiculo = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM vehiculo WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al eliminar vehiculo');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Vehiculo no encontrado');
    }
    res.send({ success: true, message: 'Vehiculo eliminado' });
  });
};

module.exports = {
  createVehiculo,
  getAllVehiculo,
  updateVehiculo,
  deleteVehiculo
};
