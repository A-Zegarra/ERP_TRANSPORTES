-- Crear la base de datos
CREATE DATABASE transportes_db;

USE transportes_db;

/* CREATE TABLE tipo_personal(
 id INT auto_increment primary key,
 nombre varchar(100) not null,
 descripcion varchar(200)
 ); */
/* CREATE TABLE tipo_contrato(
 id INT auto_increment primary key,
 nombre varchar(100) not null,
 descripcion varchar(200)
 ); */
/* create table pais(
 id int auto_increment primary key,
 nombre varchar(100),
 iso_nombre varchar(10),
 moneda varchar(50),
 iso_moneda varchar(10),
 documento varchar(20),
 descripcion_documento varchar(30)
 ); */
/* create table categoria_proveedor(
 id int auto_increment primary key,
 nombre varchar(50),
 descripcion varchar(50)
 ); */
/* create table entidad(
 id int auto_increment primary key,
 id_pais int not null,
 numero_documento varchar(20),
 nombre varchar(30),
 apellido varchar(30),
 direccion varchar(50),
 foto varchar(255),
 FOREIGN KEY (id_pais) REFERENCES pais(id) ON DELETE CASCADE
 ); */
/* create table personal(
 id int auto_increment primary key,
 id_entidad int not null,
 id_tipo_personal int not null,
 id_tipo_contrato int not null,
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE,
 FOREIGN KEY (id_tipo_personal) REFERENCES tipo_personal(id) ON DELETE CASCADE,
 FOREIGN KEY (id_tipo_contrato) REFERENCES tipo_contrato(id) ON DELETE CASCADE
 ); */
/* create table cliente(
 id int auto_increment primary key,
 id_entidad int not null,
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE
 ); */
/* create table proveedor(
 id int auto_increment primary key,
 id_entidad int not null,
 id_categoria_proveedor int not null,
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE,
 FOREIGN KEY (id_categoria_proveedor) REFERENCES categoria_proveedor(id) ON DELETE CASCADE
 ); */
/* CREATE TABLE IF NOT EXISTS archivos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 id_entidad INT NOT NULL,
 nombre varchar(100),
 tipo varchar(50),
 ruta_archivo VARCHAR(250) NOT NULL,
 fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE
 ); */
/* create table contacto(
 id int auto_increment primary key,
 id_entidad int not null,
 nombre varchar(100) not null,
 mail varchar(100),
 telefono varchar(15),
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE
 ); */
/* CREATE TABLE dato_bancario (
 id INT AUTO_INCREMENT PRIMARY KEY,
 id_entidad int not null,
 nombre VARCHAR(100),
 tipo_cuenta VARCHAR(50),
 numero_cuenta VARCHAR(100),
 cci VARCHAR(50),
 detraccion VARCHAR(50),
 FOREIGN KEY (id_entidad) REFERENCES entidad(id) ON DELETE CASCADE
 ); */
/* create table servicio (
 id int auto_increment primary key,
 nombre varchar(50) not null,
 descripcion varchar(100)
 ); */
/* create table lugar (
 id int auto_increment primary key,
 nombre varchar(150) not null,
 direccion varchar(255),
 id_pais int not null,
 FOREIGN KEY (id_pais) REFERENCES pais (id) ON DELETE CASCADE
 ); */
/* create table clase_vehiculo (
 id int auto_increment primary key,
 nombre varchar(50) NOT NULL,
 descripcion varchar(100)
 );
 */
/* CREATE TABLE IF NOT EXISTS modelo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_marca INT NOT NULL,  -- Corregida la relación
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(100),
    generacion VARCHAR(10),
    FOREIGN KEY (id_marca) REFERENCES marca(id) ON DELETE CASCADE
); */
/* CREATE TABLE IF NOT EXISTS marca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE  -- Eliminada referencia circular
); */
/* create table unidad_transporte(
 id int auto_increment primary key,
 nombre varchar(50) not null,
 descripcion varchar(60)
 ); */
/* create table peaje(
 id int auto_increment primary key,
 id_pais int not null,
 nombre varchar(30),
 ejes varchar (10),
 costo varchar(10),
 ubicacion_gps varchar(50),
 FOREIGN KEY (id_pais) REFERENCES pais (id) ON DELETE CASCADE
 ); */
/* create table vehiculo(
 id int auto_increment primary key,
 estado ENUM ('Activo', 'Inactivo') DEFAULT 'Activo',
 id_clase_vehiculo int not null,
 id_unidad_transporte int not null,
 id_marca int not null,
 id_proveedor INT,
 tipo_contratacion varchar(50),
 placa VARCHAR(20) NOT NULL UNIQUE,
 serie_chasis VARCHAR(50) NOT NULL UNIQUE,
 capacidad_carga DECIMAL(10, 2),
 km_actual INT,
 semiremolque VARCHAR(50),
 compartimientos INT,
 carroceria VARCHAR(50),
 FOREIGN KEY (id_clase_vehiculo) REFERENCES clase_vehiculo (id) ON DELETE CASCADE,
 FOREIGN KEY (id_unidad_transporte) REFERENCES unidad_transporte (id) ON DELETE CASCADE,
 FOREIGN KEY (id_marca) REFERENCES marca (id) ON DELETE CASCADE,
 FOREIGN KEY (id_proveedor) REFERENCES proveedor (id) ON DELETE CASCADE
 ); */
/* create table viaticos (
 id int auto_increment primary key,
 descripcion varchar(100),
 monto varchar(10)
 ); */
/* create table ruta(
 id int auto_increment primary key,
 id_cliente int not null,
 km_distancia varchar(20),
 galones litros FOREIGN key (id_cliente) REFERENCES cliente(id) on delete CASCADE
 ); */
/* create table ruta_peaje(
 id int auto_increment primary key,
 id_ruta int not null,
 id_peaje int not null,
 FOREIGN key (id_ruta) REFERENCES ruta(id) on delete CASCADE,
 FOREIGN key (id_peaje) REFERENCES peaje(id) on delete CASCADE
 ); */
/* create table ruta_punto(
 id int auto_increment primary key,
 id_lugar int not null,
 id_ruta int not null,
 tipo varchar(20),
 fecha datetime,
 FOREIGN key (id_lugar) REFERENCES lugar(id) on delete CASCADE,
 FOREIGN key (id_ruta) REFERENCES ruta(id) on delete CASCADE,
 ); */
create table tarifa (
    id int auto_increment primary key,
    id_cliente int not null,
    id_servicio int not null,
    monto varchar(10),
    FOREIGN KEY (id_pais) REFERENCES pais (id) ON DELETE CASCADE
);