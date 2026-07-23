-- Grünschmiede Gerätebestand – Datenbankschema
-- Einmal komplett in den SQL-Editor von Supabase einfügen und ausführen.

create extension if not exists pgcrypto;

-- Zugänge (Admin + Mitarbeiter)
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  code_hash text not null,
  rolle text not null check (rolle in ('admin', 'mitarbeiter')),
  fehlversuche int not null default 0,
  gesperrt_bis timestamptz,
  created_at timestamptz not null default now()
);

-- Angemeldete Sitzungen (ersetzt klassische Login-Sessions)
create table if not exists sessions (
  token text primary key,
  staff_id uuid not null references staff(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Fahrzeuge
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kennzeichen text default '',
  status text not null default 'ok' check (status in ('ok','wartung','defekt','weg')),
  notiz text default '',
  faellig date,
  foto_url text,
  thumb text,
  hat_bild boolean not null default false,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Geräte / Werkzeuge. ort_id ist entweder 'lager' oder die id eines Fahrzeugs (als Text).
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kategorie text default '',
  inv_nr text default '',
  serien_nr text default '',
  status text not null default 'ok' check (status in ('ok','wartung','defekt','weg')),
  ort_id text not null default 'lager',
  notiz text default '',
  geprueft date,
  intervall_monate int,
  foto_url text,
  thumb text,
  hat_bild boolean not null default false,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tools_ort_idx on tools (ort_id);
create index if not exists sessions_expires_idx on sessions (expires_at);

-- Sicherheit: Row Level Security an, aber ohne Policies.
-- Das bedeutet: NUR der service_role-Schlüssel (den ausschließlich der
-- Vercel-Server kennt) darf lesen oder schreiben. Der Browser bekommt diesen
-- Schlüssel nie zu Gesicht. Falls doch einmal der falsche Schlüssel nach
-- außen dringt, kommt trotzdem niemand an die Daten heran.
alter table staff enable row level security;
alter table sessions enable row level security;
alter table vehicles enable row level security;
alter table tools enable row level security;

-- Speicher-Bucket für Fotos (öffentlich lesbar, Schreiben nur über den Server)
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;
