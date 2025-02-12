// hooks/useTiposPersonal.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const usePersonal = () => {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPersonal = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/personal');
        setPersonal(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    cargarPersonal();
  }, []);

  return { personal, loading, error };
};

export default usePersonal;
