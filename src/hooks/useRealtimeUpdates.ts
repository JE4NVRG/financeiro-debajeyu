import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseRealtimeUpdatesProps {
  onEntradasChange?: () => void;
  onPagamentosChange?: () => void;
  onAbatimentosChange?: () => void;
  onTotaisChange?: () => void;
}

export function useRealtimeUpdates({
  onEntradasChange,
  onPagamentosChange,
  onAbatimentosChange,
  onTotaisChange
}: UseRealtimeUpdatesProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('🔄 Configurando subscriptions em tempo real...');

    // Subscription para entradas
    const entradasSubscription = supabase
      .channel('entradas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entradas'
        },
        (payload) => {
          console.log('📊 Mudança detectada em entradas:', payload);
          onEntradasChange?.();
          onTotaisChange?.();
        }
      )
      .subscribe();

    // Subscription para pagamentos de fornecedores
    const pagamentosSubscription = supabase
      .channel('pagamentos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pagamentos_fornecedores'
        },
        (payload) => {
          console.log('💸 Mudança detectada em pagamentos:', payload);
          onPagamentosChange?.();
          onTotaisChange?.();
        }
      )
      .subscribe();

    // Subscription para abatimentos
    const abatimentosSubscription = supabase
      .channel('abatimentos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'abatimentos_pre_saldo'
        },
        (payload) => {
          console.log('🔻 Mudança detectada em abatimentos:', payload);
          onAbatimentosChange?.();
          onTotaisChange?.();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔄 Removendo subscriptions...');
      entradasSubscription.unsubscribe();
      pagamentosSubscription.unsubscribe();
      abatimentosSubscription.unsubscribe();
    };
  }, [user, onEntradasChange, onPagamentosChange, onAbatimentosChange, onTotaisChange]);
}