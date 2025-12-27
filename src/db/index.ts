import { createClient } from '@supabase/supabase-js';

export type TableName =
  | 'parties'
  | 'lots'
  | 'inventory_records'
  | 'sell_records'
  | 'invoices'
  | 'memos'
  | 'production_stages'
  | 'ledger_entries'
  | 'audit_log';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  'https://mnfmiqxumamtuikgblmc.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZm1pcXh1bWFtdHVpa2dibG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODkwMzMsImV4cCI6MjA4MjM2NTAzM30.aefpPo_WHWAbLy8oapZtgoxdFdRAulBbpMpu7eyUZ0A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const toSnakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const toCamelCase = (value: string) =>
  value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const mapKeys = <T extends Record<string, unknown>>(
  row: T,
  mapper: (key: string) => string
) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [mapper(key), value]));

const toDbRow = <T extends Record<string, unknown>>(row: T) =>
  mapKeys(row, toSnakeCase);

const fromDbRow = <T extends Record<string, unknown>>(row: T) =>
  mapKeys(row, toCamelCase);

const chunkRows = <T,>(rows: T[], size = 500) => {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
};

export const fetchTable = async <T,>(table: TableName): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    throw error;
  }
  return ((data ?? []).map((row) => fromDbRow(row)) as T[]) ?? [];
};

export const fetchByIds = async <T,>(
  table: TableName,
  ids: string[]
): Promise<T[]> => {
  if (ids.length === 0) {
    return [];
  }
  const { data, error } = await supabase.from(table).select('*').in('id', ids);
  if (error) {
    throw error;
  }
  return ((data ?? []).map((row) => fromDbRow(row)) as T[]) ?? [];
};

export const insertRow = async <T,>(
  table: TableName,
  row: T
): Promise<void> => {
  const { error } = await supabase.from(table).insert(toDbRow(row as Record<string, unknown>));
  if (error) {
    throw error;
  }
};

export const upsertRows = async <T,>(
  table: TableName,
  rows: T[]
): Promise<void> => {
  for (const chunk of chunkRows(rows)) {
    const mappedChunk = chunk.map((row) => toDbRow(row as Record<string, unknown>));
    const { error } = await supabase.from(table).upsert(mappedChunk, {
      onConflict: 'id'
    });
    if (error) {
      throw error;
    }
  }
};

export const updateRow = async <T,>(
  table: TableName,
  id: string,
  changes: Partial<T>
): Promise<void> => {
  const { error } = await supabase
    .from(table)
    .update(toDbRow(changes as Record<string, unknown>))
    .eq('id', id);
  if (error) {
    throw error;
  }
};

export const updateRows = async <T,>(
  table: TableName,
  ids: string[],
  changes: Partial<T>
): Promise<void> => {
  if (ids.length === 0) {
    return;
  }
  const { error } = await supabase
    .from(table)
    .update(toDbRow(changes as Record<string, unknown>))
    .in('id', ids);
  if (error) {
    throw error;
  }
};

export const deleteRow = async (table: TableName, id: string): Promise<void> => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    throw error;
  }
};

export const deleteRows = async (
  table: TableName,
  ids: string[]
): Promise<void> => {
  if (ids.length === 0) {
    return;
  }
  const { error } = await supabase.from(table).delete().in('id', ids);
  if (error) {
    throw error;
  }
};
