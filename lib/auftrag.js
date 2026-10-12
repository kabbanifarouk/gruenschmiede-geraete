const STATUS = ["geplant", "aktiv", "abgeschlossen"];

export function auftragFelder(b, neu = false) {
  const f = {};
  if (neu || b.titel !== undefined) {
    const titel = String(b.titel || "").trim();
    if (!titel) throw Object.assign(new Error("Bitte beschreiben, was gemacht wird."), { status: 400 });
    f.titel = titel.slice(0, 200);
  }
  for (const k of ["kunde", "telefon", "adresse", "notiz"]) {
    if (b[k] !== undefined) f[k] = String(b[k] || "").trim().slice(0, 2000);
  }
  if (b.status !== undefined) {
    if (!STATUS.includes(b.status)) throw Object.assign(new Error("Unbekannter Status."), { status: 400 });
    f.status = b.status;
  }
  return f;
}
