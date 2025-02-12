import React from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CFormSelect,
  CRow,
} from '@coreui/react';

import useTiposPersonal from '../../hooks/useTiposPersonal';
import useTiposContrato from '../../hooks/useTiposContrato';

const PersonalForm = ({
  tipoPersonalNombre,
  estado,
  documento,
  nombre,
  apellido,
  direccion,
  telefono,
  correo,
  foto,
  setFormState,        // Se usa para actualizar los demás campos
  setTipoContratoNombre,   // Función exclusiva para el campo "Tipo de Contratación"
  editar,
  onAdd,
  onUpdate,
  onCancel,
}) => {
  const { tiposPersonal, loading: loadingTiposPersonal, error: errorTiposPersonal } = useTiposPersonal();
  const { tiposContrato, loading: loadingTiposContrato, error: errorTiposContrato } = useTiposContrato();

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Formulario de Personal</strong>
          </CCardHeader>
          <CCardBody>
            {/* Tipo de Personal */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="tipoPersonalNombre">Tipo de Personal:</CInputGroupText>
              <CFormSelect
                value={tipoPersonalNombre}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, tipoPersonalNombre: e.target.value }))
                }
              >
                <option value="">Seleccione...</option>
                {!loadingTiposPersonal &&
                  Array.isArray(tiposPersonal) &&
                  tiposPersonal.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
              </CFormSelect>
            </CInputGroup>
            {errorTiposPersonal && <p>Error al cargar los tipos de personal.</p>}

            {/* Estado */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="estado">Estado:</CInputGroupText>
              <CFormSelect
                value={estado}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, estado: e.target.value }))
                }
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </CFormSelect>
            </CInputGroup>

            {/* Documento */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="documento">Documento:</CInputGroupText>
              <CFormInput
                placeholder="Documento"
                value={documento}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, documento: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Nombre */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="nombre">Nombre:</CInputGroupText>
              <CFormInput
                placeholder="Nombre"
                value={nombre}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Apellido */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="apellido">Apellido:</CInputGroupText>
              <CFormInput
                placeholder="Apellido"
                value={apellido}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, apellido: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Dirección */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="direccion">Dirección:</CInputGroupText>
              <CFormInput
                placeholder="Dirección"
                value={direccion}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, direccion: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Teléfono */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="telefono">Teléfono:</CInputGroupText>
              <CFormInput
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Email */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="email">Email:</CInputGroupText>
              <CFormInput
                placeholder="Email"
                type="email"
                value={correo}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, correo: e.target.value }))
                }
              />
            </CInputGroup>

            {/* Foto */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="foto">Foto:</CInputGroupText>
              <CFormInput
                type="file"
                value={foto}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, foto: e.target.files[0] }))
                }
              />
            </CInputGroup>

            {/* Tipo de Contratación */}
            <CInputGroup className="mb-3">
              <CInputGroupText id="tipoContratoId">Tipo de Contratación:</CInputGroupText>
              <CFormSelect
                value={setTipoContratoNombre}
                onChange={(e) => setTipoContratoId(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {!loadingTiposContrato &&
                  Array.isArray(tiposContrato) &&
                  tiposContrato.map((contrato) => (
                    <option key={contrato.id} value={contrato.id}>
                      {contrato.nombre}
                    </option>
                  ))}
              </CFormSelect>
            </CInputGroup>
            {errorTiposContrato && <p>Error al cargar los tipos de contratación.</p>}

            {/* Botones */}
            {editar ? (
              <>
                <CButton color="warning" className="m-1" onClick={onUpdate}>
                  Actualizar
                </CButton>
                <CButton color="danger" className="m-1" onClick={onCancel}>
                  Cancelar
                </CButton>
              </>
            ) : (
              <CButton color="success" onClick={onAdd}>
                Registrar
              </CButton>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default PersonalForm;
