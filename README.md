# Grünschmiede – Betriebsbestand

Geräte, Fahrzeuge und Lagerbestand der Grünschmiede Greenteam.
Next.js (Vercel) + Supabase (Datenbank, Fotos).

## Bereiche

- **Übersicht** – Kennzahlen, Handlungsbedarf (Defekte, fällige Prüfungen, knappes Material), Standorte
- **Geräte** – Suche, Filter, Umbuchen, Probleme melden, Prüffristen, Fotos, Verlauf
- **Lager** – Verbrauchsmaterial mit Bestand, Mindestbestand, Entnahme/Zugang/Inventur und Bewegungsprotokoll
- **Verwaltung** (Admin) – Team-Zugänge inkl. neuem Code bei „Code vergessen“, Fahrzeuge
- **Mein Konto** – eigenen Code ändern, abmelden

## Code vergessen

- Mitarbeiter: Ein Admin vergibt in der Verwaltung → Team einen neuen Code.
- Admin: Auf der Anmeldeseite „Code vergessen?“ → mit dem Wiederherstellungsschlüssel
  (Umgebungsvariable `SETUP_SECRET` in Vercel) selbst zurücksetzen.

## Einrichtung (neues Projekt)

1. `schema.sql` im SQL-Editor von Supabase ausführen.
2. Bei Vercel importieren und Umgebungsvariablen setzen: siehe `env.example` plus `SETUP_SECRET`.
3. Deployen. Die Anmeldeseite führt zur Ersteinrichtung, solange noch kein Zugang existiert.

Ein täglicher Cron-Job (`/api/wachhalter`, siehe `vercel.json`) verhindert,
dass Supabase das kostenlose Projekt wegen Inaktivität pausiert.
