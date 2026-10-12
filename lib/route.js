import { NextResponse } from "next/server";

// Einheitliche Fehlerantwort für alle API-Routen
export function antwortFehler(e) {
  const status = e?.status || 500;
  const text = status === 500 && !e?.status ? "Interner Fehler. Bitte erneut versuchen." : e.message;
  if (status === 500) console.error(e);
  return NextResponse.json({ fehler: text, ...(e?.extra || {}) }, { status });
}

export function heuteKurz() {
  return new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Europe/Berlin",
  });
}
