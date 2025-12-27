-- Schema for Gemproject ERP public Supabase tables.
-- Run in Supabase SQL editor.

create table if not exists parties (
  id text primary key,
  name text not null,
  category text,
  phone text,
  address text
);

create table if not exists lots (
  id text primary key,
  lot_no text not null,
  description text,
  shape text,
  size text,
  grade text,
  source text,
  total_cts numeric,
  total_pcs numeric
);

create table if not exists inventory_records (
  id text primary key,
  sell_id text,
  date text not null,
  party_id text references parties (id),
  lot_id text references lots (id),
  format text,
  shape text,
  size text,
  description text,
  cts numeric not null,
  amount numeric not null,
  status text
);

create table if not exists sell_records (
  id text primary key,
  sell_id text not null,
  date text not null,
  party_id text references parties (id),
  transaction_type text,
  line_items jsonb not null default '[]'::jsonb
);

create table if not exists invoices (
  id text primary key,
  invoice_no text,
  date text not null,
  party_id text references parties (id),
  sell_id text,
  transaction_type text,
  total_cts numeric not null,
  total_amount numeric not null,
  average_price numeric not null,
  line_items jsonb not null default '[]'::jsonb
);

create table if not exists memos (
  id text primary key,
  memo_no text not null,
  date text not null,
  party_id text references parties (id),
  lot_id text references lots (id),
  stage text,
  direction text,
  status text,
  notes text
);

create table if not exists production_stages (
  id text primary key,
  lot_id text references lots (id),
  stage text,
  date text not null,
  input_cts numeric,
  output_cts numeric,
  reject_cts numeric,
  wastage_cts numeric,
  notes text
);

create table if not exists ledger_entries (
  id text primary key,
  date text not null,
  party_id text references parties (id),
  lot_id text references lots (id),
  process text,
  debit numeric not null,
  credit numeric not null,
  notes text,
  posted boolean not null default false
);

create table if not exists audit_log (
  id text primary key,
  timestamp text not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  summary text not null
);

alter table parties enable row level security;
alter table lots enable row level security;
alter table inventory_records enable row level security;
alter table sell_records enable row level security;
alter table invoices enable row level security;
alter table memos enable row level security;
alter table production_stages enable row level security;
alter table ledger_entries enable row level security;
alter table audit_log enable row level security;

create policy "public access parties" on parties for all using (true) with check (true);
create policy "public access lots" on lots for all using (true) with check (true);
create policy "public access inventory_records" on inventory_records for all using (true) with check (true);
create policy "public access sell_records" on sell_records for all using (true) with check (true);
create policy "public access invoices" on invoices for all using (true) with check (true);
create policy "public access memos" on memos for all using (true) with check (true);
create policy "public access production_stages" on production_stages for all using (true) with check (true);
create policy "public access ledger_entries" on ledger_entries for all using (true) with check (true);
create policy "public access audit_log" on audit_log for all using (true) with check (true);
