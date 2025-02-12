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

const ClienteTable = ({ clientesList = [], onEdit, onDelete }) => {
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Lista de Clientes</strong>
          </CCardHeader>
          <CCardBody>
            <CTable>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell scope="col">ID</CTableHeaderCell>
                  <CTableHeaderCell scope="col">NOMBRE</CTableHeaderCell>
                  <CTableHeaderCell scope="col">EDAD</CTableHeaderCell>
                  <CTableHeaderCell scope="col">PAIS</CTableHeaderCell>
                  <CTableHeaderCell scope="col">CARGO</CTableHeaderCell>
                  <CTableHeaderCell scope="col">AÑOS</CTableHeaderCell>
                  <CTableHeaderCell scope="col">ACCIONES</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {clientesList.map((val) => (
                  <CTableRow key={val.id}>
                    <CTableHeaderCell scope="row">{val.id}</CTableHeaderCell>
                    <CTableDataCell>{val.nombre}</CTableDataCell>
                    <CTableDataCell>{val.edad}</CTableDataCell>
                    <CTableDataCell>{val.pais}</CTableDataCell>
                    <CTableDataCell>{val.cargo}</CTableDataCell>
                    <CTableDataCell>{val.anios}</CTableDataCell>
                    <CTableDataCell>
                      <CButtonGroup role="group" aria-label="Basic mixed styles example">
                        <CButton onClick={() => onEdit(val)} color="warning">Editar</CButton>
                        <CButton onClick={() => onDelete(val)} color="danger">Eliminar</CButton>
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

export default ClienteTable
