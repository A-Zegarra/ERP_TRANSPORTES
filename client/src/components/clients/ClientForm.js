import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'

const ClienteForm = ({ nombre, setNombre, edad, setEdad, pais, setPais, cargo, setCargo, anios, setAnios, editar, onAdd, onUpdate, onCancel }) => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Fomulario</strong>
          </CCardHeader>
          <CCardBody>
            <CInputGroup className="mb-3">
              <CInputGroupText id="nombre">Nombre:</CInputGroupText>
              <CFormInput
                placeholder="Nombre"
                aria-label="Nombre"
                aria-describedby="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText id="edad">Edad:</CInputGroupText>
              <CFormInput
                placeholder="Edad"
                aria-label="Edad"
                aria-describedby="edad"
                type='number'
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText id="pais">País:</CInputGroupText>
              <CFormInput
                placeholder="País"
                aria-label="Pais"
                aria-describedby="pais"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText id="cargo">Cargo:</CInputGroupText>
              <CFormInput
                placeholder="Cargo"
                aria-label="Cargo"
                aria-describedby="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText id="anios">Años de experiencia:</CInputGroupText>
              <CFormInput
                placeholder="Años de experiencia"
                aria-label="anios"
                aria-describedby="anios"
                type='number'
                value={anios}
                onChange={(e) => setAnios(e.target.value)}
              />
            </CInputGroup>
            {editar ? (
              <>
                <CButton color="warning" className="m-1" onClick={onUpdate}> Actualizar </CButton>
                <CButton color="danger" className="m-1" onClick={onCancel}> Cancelar </CButton>
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
  )
}
export default ClienteForm
