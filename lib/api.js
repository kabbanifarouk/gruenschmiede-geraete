async function anfrage(url, methode, body) {
  let r;
  try {
    r = await fetch(url, {
      method: methode,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (e) {
    throw new Error("Keine Verbindung. Bitte Netz prüfen und erneut versuchen.");
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.fehler || "Das hat nicht geklappt. Bitte erneut versuchen."), { status: r.status, daten: d });
  return d;
}

export const api = {
  // Geräte
  toolPatch: (id, patch) => anfrage(`/api/tools/${id}`, "PATCH", patch),
  toolLoeschen: (id) => anfrage(`/api/tools/${id}`, "DELETE"),
  toolAnlegen: (g) => anfrage("/api/tools", "POST", g),
  // Fahrzeuge
  fahrzeugPatch: (id, patch) => anfrage(`/api/vehicles/${id}`, "PATCH", patch),
  fahrzeugAnlegen: (name, kennzeichen) => anfrage("/api/vehicles", "POST", { name, kennzeichen }),
  fahrzeugLoeschen: (id) => anfrage(`/api/vehicles/${id}`, "DELETE"),
  // Team
  nutzerListe: () => anfrage("/api/users", "GET"),
  nutzerAnlegen: (name, username, code, rolle) => anfrage("/api/users", "POST", { name, username, code, rolle }),
  nutzerPatch: (id, patch) => anfrage(`/api/users/${id}`, "PATCH", patch),
  nutzerLoeschen: (id) => anfrage(`/api/users/${id}`, "DELETE"),
  // Konto
  eigenenCodeAendern: (alt, neu) => anfrage("/api/konto/code", "POST", { alt, neu }),
  abmelden: () => anfrage("/api/logout", "POST"),
  // Lager
  materialAnlegen: (m) => anfrage("/api/materials", "POST", m),
  materialPatch: (id, m) => anfrage(`/api/materials/${id}`, "PATCH", m),
  materialLoeschen: (id) => anfrage(`/api/materials/${id}`, "DELETE"),
  materialBewegungen: (id) => anfrage(`/api/materials/${id}`, "GET"),
  materialBuchen: (id, art, menge, notiz, auftrag_id) => anfrage(`/api/materials/${id}/buchen`, "POST", { art, menge, notiz, auftrag_id }),
  // Aufträge
  auftragAnlegen: (a) => anfrage("/api/auftraege", "POST", a),
  auftragPatch: (id, a) => anfrage(`/api/auftraege/${id}`, "PATCH", a),
  auftragLoeschen: (id) => anfrage(`/api/auftraege/${id}`, "DELETE"),
  auftragDetails: (id) => anfrage(`/api/auftraege/${id}`, "GET"),
  // Zeiten
  timerStarten: (auftrag_id, staff_ids, wechseln) => anfrage("/api/zeiten/start", "POST", { auftrag_id, staff_ids, wechseln }),
  timerStoppen: (id) => anfrage(`/api/zeiten/${id}/stop`, "POST"),
  zeitEintragen: (z) => anfrage("/api/zeiten", "POST", z),
  zeitPatch: (id, z) => anfrage(`/api/zeiten/${id}`, "PATCH", z),
  zeitLoeschen: (id) => anfrage(`/api/zeiten/${id}`, "DELETE"),
  // Notizen & Belege
  notizAnlegen: (auftragId, text, bilder) => anfrage(`/api/auftraege/${auftragId}/notizen`, "POST", { text, bilder }),
  notizPatch: (id, patch) => anfrage(`/api/notizen/${id}`, "PATCH", patch),
  notizLoeschen: (id) => anfrage(`/api/notizen/${id}`, "DELETE"),
};
