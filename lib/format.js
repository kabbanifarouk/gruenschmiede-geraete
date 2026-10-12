export const STATUS = {
  ok: { label: "Einsatzbereit", kurz: "Bereit" },
  wartung: { label: "Wartung nötig", kurz: "Wartung" },
  defekt: { label: "Defekt", kurz: "Defekt" },
  weg: { label: "Nicht auffindbar", kurz: "Vermisst" },
};

export const LAGER = { id: "lager", name: "Lager / Betriebshof", kennzeichen: "" };

export function zeigeDatum(iso) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function zeigeZeit(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  const heute = new Date();
  const gestern = new Date(); gestern.setDate(heute.getDate() - 1);
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === heute.toDateString()) return `Heute, ${uhr}`;
  if (d.toDateString() === gestern.toDateString()) return `Gestern, ${uhr}`;
  return `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}, ${uhr}`;
}

export function heuteISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function pruefStatus(t) {
  if (!t.intervall_monate || !t.geprueft) return null;
  const f = new Date(t.geprueft);
  f.setMonth(f.getMonth() + Number(t.intervall_monate));
  return { tage: Math.round((f - new Date()) / 86400000), datum: f.toISOString().slice(0, 10) };
}

export function fristText(tage) {
  if (tage < 0) return `${-tage} ${-tage === 1 ? "Tag" : "Tage"} überfällig`;
  if (tage === 0) return "heute fällig";
  if (tage === 1) return "morgen fällig";
  return `in ${tage} Tagen fällig`;
}

export function artFuer(tool) {
  const t = `${tool.kategorie || ""} ${tool.name || ""}`.toLowerCase();
  if (/mäher|maeher|rasen|vertikut|mulch|aufsitz/.test(t)) return "maeher";
  if (/säge|saege|motor|kette|trenn|bohr|freischneider|blas|häcksl|haecksl|heckensch|rüttel|ruettel/.test(t)) return "motorgeraet";
  if (/anhänger|anhaenger|hänger|trailer/.test(t)) return "anhaenger";
  if (/schlüssel|zange|hammer|schaufel|spaten|handwerk|werkzeug|rechen|harke|schubkarre/.test(t)) return "werkzeug";
  return "kiste";
}

export function zaehle(liste) {
  const z = { alle: liste.length, ok: 0, wartung: 0, defekt: 0, weg: 0 };
  liste.forEach((x) => { z[x.status || "ok"] = (z[x.status || "ok"] || 0) + 1; });
  return z;
}

export function initialen(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export function vergleich(a, b) {
  return (a || "").localeCompare(b || "", "de", { sensitivity: "base" });
}

export function passtSuche(text, suche) {
  if (!suche) return true;
  const t = text.toLowerCase();
  return suche.toLowerCase().split(/\s+/).filter(Boolean).every((w) => t.includes(w));
}

// ---------- Lager ----------

export const MATERIAL_KATEGORIEN = [
  "Beton & Mörtel",
  "Pflaster & Platten",
  "Randsteine & Mauersteine",
  "Schüttgüter",
  "Erde & Substrate",
  "Rasen & Saatgut",
  "Pflanzen",
  "Dünger & Pflanzenschutz",
  "Holz & Zaun",
  "Entwässerung & Rohre",
  "Vlies & Folien",
  "Kleinmaterial",
  "Betriebsstoffe",
];

export const EINHEITEN = ["Stück", "Sack", "Palette", "Big Bag", "t", "kg", "m³", "m²", "lfm", "Rolle", "l", "Eimer"];

export function artFuerMaterial(m) {
  const t = `${m.kategorie || ""} ${m.name || ""} ${m.einheit || ""}`.toLowerCase();
  if (/pflaster(?!fug)|platte|stein|klinker|mauer|bord|palisade/.test(t) && !/mörtel|moertel|fugen/.test(t)) return "steine";
  if (/beton|mörtel|moertel|zement|estrich|fugen|kleber/.test(t)) return "sack";
  if (/splitt|kies|sand|schotter|schütt|schuett|mineral|erde|substrat|humus|mulch|rinde/.test(t)) return "haufen";
  if (/pflanz|rasen|saat|baum|strauch|hecke|stauden|dünger|duenger/.test(t)) return "pflanze";
  if (/rohr|drain|rinne|entwässer|entwaesser|schacht|ablauf/.test(t)) return "rohr";
  if (/holz|zaun|pfosten|latte|brett|balken/.test(t)) return "holz";
  if (/öl|oel|benzin|diesel|kraftstoff|betriebsstoff|kanister|schmier/.test(t)) return "kanister";
  if (/sack/.test(t)) return "sack";
  if (/palette/.test(t)) return "palette";
  return "lager";
}

export function zahlText(n) {
  if (n === null || n === undefined || n === "") return "–";
  return Number(n).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export function euro(n) {
  if (n === null || n === undefined) return "–";
  return Number(n).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// "ok" | "knapp" | "leer"
export function bestandsLage(m) {
  const b = Number(m.bestand || 0);
  if (b <= 0) return "leer";
  if (m.mindestbestand !== null && m.mindestbestand !== undefined && b <= Number(m.mindestbestand)) return "knapp";
  return "ok";
}

export function fuellProzent(m) {
  const b = Number(m.bestand || 0);
  const min = Number(m.mindestbestand || 0);
  const ziel = min > 0 ? min * 3 : Math.max(b, 1);
  return Math.max(0, Math.min(100, (b / ziel) * 100));
}

export function markerProzent(m) {
  const min = Number(m.mindestbestand || 0);
  return min > 0 ? 100 / 3 : null;
}

// ---------- Aufträge & Zeiten ----------

export const AUFTRAG_STATUS = {
  geplant: { label: "Geplant", klasse: "plan" },
  aktiv: { label: "In Arbeit", klasse: "ok" },
  abgeschlossen: { label: "Abgeschlossen", klasse: "fertig" },
};

// 450 -> "7 h 30 min", 60 -> "1 h", 25 -> "25 min"
export function dauer(minuten) {
  const m = Math.max(0, Math.round(Number(minuten) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

// Sekunden -> "02:13:45"
export function uhr(sekunden) {
  const s = Math.max(0, Math.floor(sekunden));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function uhrzeit(iso) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function tagText(datum) {
  const d = new Date(datum + "T12:00:00");
  const heute = heuteISO();
  const g = new Date(); g.setDate(g.getDate() - 1);
  const gestern = new Date(g.getTime() - g.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (datum === heute) return "Heute";
  if (datum === gestern) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function adresseLink(adresse) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
}

export function telLink(tel) {
  return `tel:${String(tel).replace(/[^\d+]/g, "")}`;
}
