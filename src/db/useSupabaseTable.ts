import { useCallback, useEffect, useState } from 'react';
import { fetchTable, supabase, type TableName } from './index';

export const useSupabaseTable = <T,>(table: TableName) => {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchTable<T>(table);
      setData(rows);
      setError(undefined);
    } catch (err) {
      const errorInstance =
        err instanceof Error ? err : new Error('Failed to load data');
      console.error(errorInstance);
      setError(errorInstance);
    }
  }, [table]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`table-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          void refresh();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, table]);

  return { data, error, refresh };
};
