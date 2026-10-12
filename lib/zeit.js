import { db } from "./db";

// Kalendertag in deutscher Zeit, z. B. "2026-10-12"
export function berlinDatum(d = new Date()) {
  return new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

export function fehler(text, status = 400, extra = {}) {
  return Object.assign(new Error(text), { status, extra });
}

// Laufende Timer beenden und die Dauer in Minuten festschreiben
export async function timerStoppen(eintraege) {
  const jetzt = new Date();
  const ergebnis = [];
  for (const z of eintraege) {
    const minuten = Math.max(1, Math.round((jetzt - new Date(z.start)) / 60000));
    const { data } = await db()
      .from("zeiten")
      .update({ ende: jetzt.toISOString(), minuten: Math.min(minuten, 2880), datum: berlinDatum(z.start) })
      .eq("id", z.id)
      .is("ende", null)
      .select()
      .maybeSingle();
    if (data) ergebnis.push(data);
  }
  return ergebnis;
}

// Für wen darf die angemeldete Person Zeiten erfassen?
export async function personenPruefen(sitzung, staffIds) {
  const ids = Array.isArray(staffIds) && staffIds.length ? [...new Set(staffIds)] : [sitzung.id];
  if (sitzung.rolle !== "admin" && (ids.length !== 1 || ids[0] !== sitzung.id)) {
    throw fehler("Du kannst nur deine eigenen Zeiten erfassen.", 403);
  }
  const { data } = await db().from("staff").select("id, name").in("id", ids);
  if (!data || data.length !== ids.length) throw fehler("Mitarbeiter nicht gefunden.", 400);
  return data;
}

export async function auftragLaden(id) {
  const { data } = await db().from("auftraege").select("*").eq("id", id).maybeSingle();
  if (!data) throw fehler("Auftrag nicht gefunden.", 404);
  return data;
}

export function darfZeitAendern(sitzung, z) {
  return sitzung.rolle === "admin" || z.staff_id === sitzung.id;
}
