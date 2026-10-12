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
  if (!r.ok) throw new Error(d.fehler || "Das hat nicht geklappt. Bitte erneut versuchen.");
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
  materialBuchen: (id, art, menge, notiz) => anfrage(`/api/materials/${id}/buchen`, "POST", { art, menge, notiz }),
};
