/*
  # Initial Schema for Gemproject ERP

  1. New Tables
    - `parties` - Stores customer/supplier information
      - `id` (text, primary key)
      - `name` (text, not null)
      - `category` (text)
      - `phone` (text)
      - `address` (text)
    
    - `lots` - Stores lot/batch information
      - `id` (text, primary key)
      - `lot_no` (text, not null)
      - `description` (text)
      - `shape` (text)
      - `size` (text)
      - `grade` (text)
      - `source` (text)
      - `total_cts` (numeric)
      - `total_pcs` (numeric)
    
    - `inventory_records` - Tracks inventory and sell records
      - `id` (text, primary key)
      - `sell_id` (text)
      - `date` (text, not null)
      - `party_id` (text, foreign key to parties)
      - `lot_id` (text, foreign key to lots)
      - `format` (text)
      - `shape` (text)
      - `size` (text)
      - `description` (text)
      - `cts` (numeric, not null)
      - `amount` (numeric, not null)
      - `status` (text)
    
    - `sell_records` - Stores completed sales
      - `id` (text, primary key)
      - `sell_id` (text, not null)
      - `date` (text, not null)
      - `party_id` (text, foreign key to parties)
      - `transaction_type` (text)
      - `line_items` (jsonb, default '[]')
    
    - `invoices` - Stores invoice records
      - `id` (text, primary key)
      - `invoice_no` (text)
      - `date` (text, not null)
      - `party_id` (text, foreign key to parties)
      - `sell_id` (text)
      - `transaction_type` (text)
      - `total_cts` (numeric, not null)
      - `total_amount` (numeric, not null)
      - `average_price` (numeric, not null)
      - `line_items` (jsonb, default '[]')
    
    - `memos` - Tracks memo in/out records
      - `id` (text, primary key)
      - `memo_no` (text, not null)
      - `date` (text, not null)
      - `party_id` (text, foreign key to parties)
      - `lot_id` (text, foreign key to lots)
      - `stage` (text)
      - `direction` (text)
      - `status` (text)
      - `notes` (text)
    
    - `production_stages` - Tracks production stage events
      - `id` (text, primary key)
      - `lot_id` (text, foreign key to lots)
      - `stage` (text)
      - `date` (text, not null)
      - `input_cts` (numeric)
      - `output_cts` (numeric)
      - `reject_cts` (numeric)
      - `wastage_cts` (numeric)
      - `notes` (text)
    
    - `ledger_entries` - Cashbook/ledger records
      - `id` (text, primary key)
      - `date` (text, not null)
      - `party_id` (text, foreign key to parties)
      - `lot_id` (text, foreign key to lots)
      - `process` (text)
      - `debit` (numeric, not null)
      - `credit` (numeric, not null)
      - `notes` (text)
      - `posted` (boolean, default false)
    
    - `audit_log` - Audit trail for all operations
      - `id` (text, primary key)
      - `timestamp` (text, not null)
      - `entity_type` (text, not null)
      - `entity_id` (text, not null)
      - `action` (text, not null)
      - `summary` (text, not null)

  2. Security
    - Enable RLS on all tables
    - Add public access policies for all operations (suitable for single-user ERP)
*/

-- Create parties table
create table if not exists parties (
  id text primary key,
  name text not null,
  category text default '',
  phone text default '',
  address text default ''
);

-- Create lots table
create table if not exists lots (
  id text primary key,
  lot_no text not null,
  description text default '',
  shape text default '',
  size text default '',
  grade text default '',
  source text default '',
  total_cts numeric default 0,
  total_pcs numeric default 0
);

-- Create inventory_records table
create table if not exists inventory_records (
  id text primary key,
  sell_id text default '',
  date text not null,
  party_id text references parties (id) on delete set null,
  lot_id text references lots (id) on delete set null,
  format text default '',
  shape text default '',
  size text default '',
  description text default '',
  cts numeric not null default 0,
  amount numeric not null default 0,
  status text default 'available'
);

-- Create sell_records table
create table if not exists sell_records (
  id text primary key,
  sell_id text not null,
  date text not null,
  party_id text references parties (id) on delete set null,
  transaction_type text default '',
  line_items jsonb not null default '[]'::jsonb
);

-- Create invoices table
create table if not exists invoices (
  id text primary key,
  invoice_no text default '',
  date text not null,
  party_id text references parties (id) on delete set null,
  sell_id text default '',
  transaction_type text default '',
  total_cts numeric not null default 0,
  total_amount numeric not null default 0,
  average_price numeric not null default 0,
  line_items jsonb not null default '[]'::jsonb
);

-- Create memos table
create table if not exists memos (
  id text primary key,
  memo_no text not null,
  date text not null,
  party_id text references parties (id) on delete set null,
  lot_id text references lots (id) on delete set null,
  stage text default '',
  direction text default 'out',
  status text default 'open',
  notes text default ''
);

-- Create production_stages table
create table if not exists production_stages (
  id text primary key,
  lot_id text references lots (id) on delete set null,
  stage text default '',
  date text not null,
  input_cts numeric default 0,
  output_cts numeric default 0,
  reject_cts numeric default 0,
  wastage_cts numeric default 0,
  notes text default ''
);

-- Create ledger_entries table
create table if not exists ledger_entries (
  id text primary key,
  date text not null,
  party_id text references parties (id) on delete set null,
  lot_id text references lots (id) on delete set null,
  process text default '',
  debit numeric not null default 0,
  credit numeric not null default 0,
  notes text default '',
  posted boolean not null default false
);

-- Create audit_log table
create table if not exists audit_log (
  id text primary key,
  timestamp text not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  summary text not null
);

-- Enable RLS on all tables
alter table parties enable row level security;
alter table lots enable row level security;
alter table inventory_records enable row level security;
alter table sell_records enable row level security;
alter table invoices enable row level security;
alter table memos enable row level security;
alter table production_stages enable row level security;
alter table ledger_entries enable row level security;
alter table audit_log enable row level security;

-- Create public access policies for all tables
-- Note: This is appropriate for a single-user/internal ERP application

create policy "Public access to parties"
  on parties
  for all
  using (true)
  with check (true);

create policy "Public access to lots"
  on lots
  for all
  using (true)
  with check (true);

create policy "Public access to inventory_records"
  on inventory_records
  for all
  using (true)
  with check (true);

create policy "Public access to sell_records"
  on sell_records
  for all
  using (true)
  with check (true);

create policy "Public access to invoices"
  on invoices
  for all
  using (true)
  with check (true);

create policy "Public access to memos"
  on memos
  for all
  using (true)
  with check (true);

create policy "Public access to production_stages"
  on production_stages
  for all
  using (true)
  with check (true);

create policy "Public access to ledger_entries"
  on ledger_entries
  for all
  using (true)
  with check (true);

create policy "Public access to audit_log"
  on audit_log
  for all
  using (true)
  with check (true);