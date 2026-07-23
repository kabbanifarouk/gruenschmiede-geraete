export const STATUS = {
  ok: { label: "Einsatzbereit", band: "#79BE59", text: "#42762C" },
  wartung: { label: "Wartung nötig", band: "#E0A100", text: "#8F6600" },
  defekt: { label: "Defekt", band: "#C0392B", text: "#A32A1E" },
  weg: { label: "Nicht auffindbar", band: "#5C6360", text: "#454B48" },
};

export function zeigeDatum(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE");
}

export function heuteISO() {
  return new Date().toISOString().slice(0, 10);
}

export function pruefStatus(t) {
  if (!t.intervall_monate || !t.geprueft) return null;
  const f = new Date(t.geprueft);
  f.setMonth(f.getMonth() + Number(t.intervall_monate));
  return { tage: Math.round((f - new Date()) / 86400000), datum: f.toISOString().slice(0, 10) };
}

export function artFuer(tool) {
  const t = `${tool.kategorie || ""} ${tool.name || ""}`.toLowerCase();
  if (/säge|saege|motor|kette|trenn|bohr|freischneider|blas|häcksl|haecksl/.test(t)) return "motorgeraet";
  if (/mäher|maeher|rasen|vertikut|mulch/.test(t)) return "maeher";
  if (/anhänger|anhaenger|hänger|trailer/.test(t)) return "anhaenger";
  if (/schlüssel|zange|hammer|schaufel|spaten|handwerk|werkzeug|rechen|harke/.test(t)) return "werkzeug";
  return "kiste";
}

export function zaehle(liste) {
  const z = { alle: liste.length, ok: 0, wartung: 0, defekt: 0, weg: 0 };
  liste.forEach((x) => { z[x.status || "ok"] = (z[x.status || "ok"] || 0) + 1; });
  return z;
}
