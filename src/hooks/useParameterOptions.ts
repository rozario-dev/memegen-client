import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import type { ParameterOptions } from '../lib/types';

export const useParameterOptions = () => {
  const [options, setOptions] = useState<ParameterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getParameterOptions();
      setOptions(data);
    } catch {
      setError('Failed to load parameter options');
    } finally {
      setLoading(false);
    }
  };

  return { options, loading, error, refetch: loadOptions };
};