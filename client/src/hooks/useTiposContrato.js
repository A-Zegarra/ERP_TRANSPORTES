// src/hooks/useTiposContrato.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useTiposContrato = () => {
  const [tiposContrato, setTiposContrato] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTiposContrato = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/tipo_contrato');
        setTiposContrato(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposContrato();
  }, []);

  return { tiposContrato, loading, error };
};

export default useTiposContrato;
