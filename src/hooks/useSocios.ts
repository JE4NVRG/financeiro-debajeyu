import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Socio, UseSociosReturn } from '@/types/database';

export function useSocios(): UseSociosReturn {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSocios = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('socios')
        .select('*')
        .order('nome');

      if (fetchError) {
        throw new Error(`Erro ao buscar sócios: ${fetchError.message}`);
      }

      setSocios(data || []);
    } catch (err) {
      console.error('Erro ao buscar sócios:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getSocioById = (id: string): Socio | undefined => {
    return socios.find(socio => socio.id === id);
  };

  const updateSocio = async (id: string, socioData: Partial<Socio>) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('socios')
        .update(socioData)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Erro ao atualizar sócio: ${updateError.message}`);
      }

      // Atualizar o estado local
      setSocios(prevSocios => 
        prevSocios.map(socio => 
          socio.id === id ? { ...socio, ...socioData } : socio
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar sócio:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      throw err;
    }
  };

  const refetch = () => {
    fetchSocios();
  };

  useEffect(() => {
    fetchSocios();
  }, []);

  return {
    socios,
    loading,
    error,
    refetch,
    getSocioById,
    updateSocio,
  };
}