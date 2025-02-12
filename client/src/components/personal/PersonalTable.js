// src/components/personal/PersonalTable.js
import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CButtonGroup
} from '@coreui/react'

const PersonalTable = ({ personalList = [], onEdit, onDelete }) => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Lista de Personal</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover responsive>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>ID</CTableHeaderCell>
                  <CTableHeaderCell>Tipo de Personal</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Documento</CTableHeaderCell>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Apellido</CTableHeaderCell>
                  <CTableHeaderCell>Dirección</CTableHeaderCell>
                  <CTableHeaderCell>Teléfono</CTableHeaderCell>
                  <CTableHeaderCell>Tipo de Contratación</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {personalList.map((val) => (
                  <CTableRow key={val.id}>
                    <CTableHeaderCell scope="row">{val.id}</CTableHeaderCell>
                    <CTableDataCell>{val.tipo_personal_nombre}</CTableDataCell>
                    <CTableDataCell>{val.estado}</CTableDataCell>
                    <CTableDataCell>{val.numero_documento}</CTableDataCell>
                    <CTableDataCell>{val.nombre}</CTableDataCell>
                    <CTableDataCell>{val.apellido}</CTableDataCell>
                    <CTableDataCell>{val.direccion}</CTableDataCell>
                    <CTableDataCell>{val.telefono}</CTableDataCell>
                    <CTableDataCell>{val.tipo_contrato_nombre}</CTableDataCell>
                    <CTableDataCell>
                      <CButtonGroup role="group" aria-label="Acciones">
                        <CButton color="warning" onClick={() => onEdit(val)}>
                          Editar
                        </CButton>
                        <CButton color="danger" onClick={() => onDelete(val)}>
                          Eliminar
                        </CButton>
                      </CButtonGroup>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PersonalTable;
