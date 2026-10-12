-- ============================================================
-- Notizen & Belege je Auftrag
-- Text steht in der Datenbank, Bilder im privaten Speicher-Bucket "belege".
-- In der Datenbank liegen nur die Pfade (wenige Bytes pro Bild).
-- ============================================================

create table if not exists auftrag_notizen (
  id uuid primary key default gen_random_uuid(),
  auftrag_id uuid not null references auftraege(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,
  wer text not null default '',
  text text not null default '' check (char_length(text) <= 4000),
  -- [{ "gross": "pfad", "klein": "pfad", "b": 1600, "h": 1200, "bytes": 182000 }]
  bilder jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auftrag_notizen_auftrag_idx on auftrag_notizen (auftrag_id, created_at desc);
alter table auftrag_notizen enable row level security;

-- Privater Bucket: nur der Server kommt heran, Bilder werden über
-- zeitlich begrenzte Links ausgeliefert. Max. 1,5 MB pro Datei, nur Bilder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('belege', 'belege', false, 1572864, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;
