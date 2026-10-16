-- Run this once in Supabase: SQL Editor > New query. Skip it if your orders table already exists.
create table orders (
  id         bigint generated always as identity primary key,
  code       text not null unique,
  name       text not null,
  phone      text not null,
  note       text,
  items      jsonb not null,
  total      integer not null,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

-- Lock the table: the website writes through the server with the service key.
alter table orders enable row level security;
