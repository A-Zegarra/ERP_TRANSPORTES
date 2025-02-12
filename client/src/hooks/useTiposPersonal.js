// src/hooks/useTiposPersonal.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useTiposPersonal = () => {
  const [tiposPersonal, setTiposPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTiposPersonal = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/tipo_personal');
        setTiposPersonal(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposPersonal();
  }, []);

  return { tiposPersonal, loading, error };
};

export default useTiposPersonal;
