// src/services/clienteService.js
import axios from 'axios';

// Configuración base de Axios (opcional, para no repetir la URL cada vez)
const api = axios.create({
  baseURL: 'http://localhost:3001'
});

export const getPersonal = () => {
  return api.get('/api/personal');
};

export const createPersonal = (data) => {
  return api.post('/api/personal/create', data);
};

export const updatePersonal = (data) => {
  return api.put('/api/personal/update', data);
};

export const deletePersonal = (id) => {
  return api.delete(`/api/personal/delete/${id}`);
};
