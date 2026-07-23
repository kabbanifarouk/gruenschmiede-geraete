async function anfrage(url, methode, body) {
  const r = await fetch(url, {
    method: methode,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.fehler || "Anfrage fehlgeschlagen");
  return d;
}

export const api = {
  toolPatch: (id, patch) => anfrage(`/api/tools/${id}`, "PATCH", patch),
  toolLoeschen: (id) => anfrage(`/api/tools/${id}`, "DELETE"),
  toolAnlegen: (g) => anfrage("/api/tools", "POST", g),
  fahrzeugPatch: (id, patch) => anfrage(`/api/vehicles/${id}`, "PATCH", patch),
  fahrzeugAnlegen: (name, kennzeichen) => anfrage("/api/vehicles", "POST", { name, kennzeichen }),
  fahrzeugLoeschen: (id) => anfrage(`/api/vehicles/${id}`, "DELETE"),
  nutzerListe: () => anfrage("/api/users", "GET"),
  nutzerAnlegen: (name, username, code, rolle) => anfrage("/api/users", "POST", { name, username, code, rolle }),
  nutzerLoeschen: (id) => anfrage(`/api/users/${id}`, "DELETE"),
};
