import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';

import {
  createPersonal,
  updatePersonal,
  deletePersonal,
  getPersonal,
} from '../../components/services/personalService';

import PersonalForm from '../../components/personal/PersonalForm';
import PersonalTable from '../../components/personal/PersonalTable';

function Personal() {
  // Estado inicial del formulario, incluyendo el nuevo campo "tipoContratoId"
  const initialFormState = {
    id: '',
    tipoPersonalId: '',
    estado: 'Activo',
    documento: '',
    nombre: '',
    apellido: '',
    direccion: '',
    telefono: '',
    correo: '',
    foto: null,
    tipoContratoId: ''
  };

  const [formState, setFormState] = useState(initialFormState);
  const [editar, setEditar] = useState(false);
  const [personalList, setPersonalList] = useState([]);

  // Cargar la lista de personal al montar el componente
  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    try {
      const response = await getPersonal();
      setPersonalList(response.data);
    } catch (error) {
      mostrarError('No se pudo cargar la lista de personal');
    }
  };

  // Función para manejar el registro de un nuevo personal
  const handleAdd = async () => {
    try {
      await createPersonal(formState);
      cargarPersonal();
      limpiarCampos();
      mostrarExito(`Personal ${formState.nombre} creado correctamente`);
    } catch (error) {
      mostrarError('No se pudo crear el personal');
    }
  };

  // Función para manejar la actualización de un registro existente
  const handleUpdate = async () => {
    try {
      await updatePersonal(formState);
      cargarPersonal();
      limpiarCampos();
      mostrarExito(`Personal ${formState.nombre} actualizado correctamente`);
    } catch (error) {
      mostrarError('No se pudo actualizar el personal');
    }
  };

  // Función para manejar la eliminación de un registro
  const handleDelete = (personal) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás al personal ${personal.nombre} ${personal.apellido}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePersonal(personal.id);
          cargarPersonal();
          mostrarExito(`Personal ${personal.nombre} eliminado correctamente`);
        } catch (error) {
          mostrarError('No se pudo eliminar el personal');
        }
      }
    });
  };

  // Función para mostrar mensajes de éxito
  const mostrarExito = (mensaje) => {
    Swal.fire({
      title: 'Éxito',
      text: mensaje,
      icon: 'success',
      timer: 2000,
    });
  };

  // Función para mostrar mensajes de error
  const mostrarError = (mensaje) => {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      timer: 2000,
    });
  };

  // Función para limpiar los campos del formulario
  const limpiarCampos = () => {
    setFormState(initialFormState);
    setEditar(false);
  };

  // Función para actualizar el campo "tipoContratoId" dentro del estado
  const setTipoContratoId = (value) => {
    setFormState((prev) => ({ ...prev, tipoContratoId: value }));
  };

  // Función para habilitar el modo de edición y cargar los datos del registro seleccionado
  const editarPersonal = (personal) => {
    setEditar(true);
    setFormState({
      id: personal.id,
      tipoPersonalId: personal.tipo_personal_nombre || "",
      estado: personal.estado || "Activo",
      documento: personal.numero_documento || "",
      nombre: personal.nombre || "",
      apellido: personal.apellido || "",
      direccion: personal.direccion || "",
      telefono: personal.telefono || "",
      correo: personal.correo || "",
      foto: personal.foto || null,
      tipoContratoId: personal.tipo_contrato_nombre || ""
    });
  };

  // Renderizado de componentes
  return (
    <div>
      <PersonalForm
        {...formState}
        setFormState={setFormState}
        setTipoContratoId={setTipoContratoId}  // Se pasa la función para actualizar "tipoContratoId"
        editar={editar}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onCancel={limpiarCampos}
      />
      <PersonalTable
        personalList={personalList}
        onDelete={handleDelete}
        onEdit={editarPersonal}
      />
    </div>
  );
}

export default Personal;
