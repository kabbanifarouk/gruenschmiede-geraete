-- ============================================================
-- Aufträge / Baustellen mit Zeiterfassung und Materialverbrauch
-- ============================================================

create table if not exists auftraege (
  id uuid primary key default gen_random_uuid(),
  nummer int generated always as identity,
  titel text not null,
  kunde text not null default '',
  telefon text not null default '',
  adresse text not null default '',
  status text not null default 'geplant' check (status in ('geplant','aktiv','abgeschlossen')),
  notiz text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Arbeitszeiten: per Timer (start/ende) oder manuell (datum + minuten)
create table if not exists zeiten (
  id uuid primary key default gen_random_uuid(),
  auftrag_id uuid not null references auftraege(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,
  wer text not null default '',
  datum date not null default ((now() at time zone 'Europe/Berlin')::date),
  minuten int not null default 0 check (minuten >= 0 and minuten <= 2880),
  start timestamptz,
  ende timestamptz,
  quelle text not null default 'manuell' check (quelle in ('timer','manuell')),
  notiz text not null default '',
  erfasst_von text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists zeiten_auftrag_idx on zeiten (auftrag_id, datum desc);
-- Pro Person darf höchstens ein Timer gleichzeitig laufen
create unique index if not exists zeiten_ein_timer_pro_person on zeiten (staff_id) where quelle = 'timer' and ende is null;

alter table auftraege enable row level security;
alter table zeiten enable row level security;

-- Materialverbrauch einem Auftrag zuordnen
alter table material_bewegungen add column if not exists auftrag_id uuid references auftraege(id) on delete set null;
create index if not exists material_bewegungen_auftrag_idx on material_bewegungen (auftrag_id) where auftrag_id is not null;

-- Summen je Auftrag (Stunden, Materialwert)
create or replace view auftrag_summen with (security_invoker = true) as
select
  a.id as auftrag_id,
  coalesce((select sum(z.minuten) from zeiten z where z.auftrag_id = a.id), 0)::int as minuten,
  coalesce((select sum(-b.menge * coalesce(m.preis, 0))
            from material_bewegungen b join materials m on m.id = b.material_id
            where b.auftrag_id = a.id), 0)::numeric(12,2) as materialwert,
  (select max(z.datum) from zeiten z where z.auftrag_id = a.id) as zuletzt
from auftraege a;

revoke all on auftrag_summen from anon, authenticated;

-- Buchungsfunktion mit Auftragsbezug (neue Variante mit 6 Parametern; die alte
-- Variante mit 5 Parametern bleibt unangetastet bestehen)
create or replace function material_buchen(p_id uuid, p_art text, p_menge numeric, p_notiz text, p_wer text, p_auftrag uuid)
returns materials
language plpgsql
set search_path = public
as $$
declare
  m materials;
  neu numeric(12,2);
  delta numeric(12,2);
begin
  select * into m from materials where id = p_id for update;
  if not found then raise exception 'Artikel nicht gefunden'; end if;
  if p_menge is null or p_menge < 0 then raise exception 'Ungültige Menge'; end if;
  if p_art = 'zugang' then
    neu := m.bestand + p_menge; delta := p_menge;
  elsif p_art = 'abgang' then
    if p_menge > m.bestand then raise exception 'Nicht genug auf Lager (vorhanden: % %)', replace(trim_scale(m.bestand)::text, '.', ','), m.einheit; end if;
    neu := m.bestand - p_menge; delta := -p_menge;
  elsif p_art = 'korrektur' then
    neu := p_menge; delta := p_menge - m.bestand;
  else
    raise exception 'Unbekannte Buchungsart';
  end if;
  update materials set bestand = neu, updated_at = now() where id = p_id returning * into m;
  insert into material_bewegungen (material_id, art, menge, bestand_nach, notiz, wer, auftrag_id)
  values (p_id, p_art, delta, neu, coalesce(p_notiz, ''), coalesce(p_wer, ''), p_auftrag);
  return m;
end;
$$;

revoke execute on function material_buchen(uuid, text, numeric, text, text, uuid) from public, anon, authenticated;
