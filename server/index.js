const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
const tipo_contratoRoutes = require('./src/routes/tipo_contratoRoutes');
const tipo_personalRoutes = require('./src/routes/tipo_personalRoutes');
const paisRoutes = require('./src/routes/paisRoutes');
const categoriaProveedorRoutes = require('./src/routes/categoriaProveedorRoutes');
const servicioRoutes = require('./src/routes/servicioRoutes');
const entidadRoutes = require('./src/routes/entidadRoutes');
const personalRoutes = require('./src/routes/personalRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const archivoRoutes = require('./src/routes/archivoRoutes');
const contactoRoutes = require('./src/routes/contactoRoutes');
const datoBancarioRoutes = require('./src/routes/datoBancarioRoutes');
const lugarRoutes = require('./src/routes/lugarRoutes');
const claseVehiculoRoutes = require('./src/routes/claseVehiculoRoutes');
const modeloRoutes = require('./src/routes/modeloRoutes');
const marcaRoutes = require('./src/routes/marcaRoutes');
const unidadTransporteRoutes = require('./src/routes/unidadTransporteRoutes');
const peajeRoutes = require('./src/routes/peajeRoutes');
const vehiculoRoutes = require('./src/routes/vehiculoRoutes');
const viaticosRoutes = require('./src/routes/viaticosRoutes');
const rutaRoutes = require('./src/routes/rutaRoutes');
const rutaPeajeRoutes = require('./src/routes/rutaPeajeRoutes');
const rutaPuntoRoutes = require('./src/routes/rutaPuntoRoutes');
const tarifaRoutes = require('./src/routes/tarifaRoutes');


// Montamos las rutas en la raíz ("/"), puedes usar prefijos como "/api" si gustas:
app.use('/api/tipo_contrato', tipo_contratoRoutes);
app.use('/api/tipo_personal', tipo_personalRoutes);
app.use('/api/pais', paisRoutes);
app.use('/api/categoria_proveedor', categoriaProveedorRoutes);
app.use('/api/servicio', servicioRoutes);
app.use('/api/entidad', entidadRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/proveedor', proveedorRoutes);
app.use('/api/archivo', archivoRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/dato_bancario', datoBancarioRoutes);
app.use('/api/lugar', lugarRoutes);
app.use('/api/clase_vehiculo', claseVehiculoRoutes);
app.use('/api/modelo', modeloRoutes);
app.use('/api/marca', marcaRoutes);
app.use('/api/unidad_transporte', unidadTransporteRoutes);
app.use('/api/peaje', peajeRoutes);
app.use('/api/vehiculo', vehiculoRoutes);
app.use('/api/viaticos', viaticosRoutes);
app.use('/api/ruta', rutaRoutes);
app.use('/api/ruta_peaje', rutaPeajeRoutes);
app.use('/api/ruta_punto', rutaPuntoRoutes);
app.use('/api/tarifa', tarifaRoutes);


// Iniciamos el servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Corriendo en el puerto ${PORT}`);
});
