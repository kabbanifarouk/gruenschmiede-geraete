// Gemeinsame Prüfung der Felder eines Lagerartikels (Server)
function zahl(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) {
    const e = new Error("Bitte eine gültige, positive Zahl eingeben.");
    e.status = 400;
    throw e;
  }
  return Math.round(n * 100) / 100;
}

export function materialFelder(b, neu = false) {
  const f = {};
  if (neu || b.name !== undefined) {
    const name = (b.name || "").trim();
    if (!name) throw Object.assign(new Error("Bezeichnung fehlt."), { status: 400 });
    f.name = name;
  }
  for (const k of ["kategorie", "einheit", "lagerort", "artikel_nr", "notiz"]) {
    if (b[k] !== undefined) f[k] = String(b[k] || "").trim();
  }
  if (f.einheit === "") f.einheit = "Stück";
  if (b.mindestbestand !== undefined) f.mindestbestand = zahl(b.mindestbestand);
  if (b.preis !== undefined) f.preis = zahl(b.preis);
  return f;
}

export { zahl };
