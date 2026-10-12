"use client";
import { useState } from "react";
import Icon from "./Icon";
import { komprimieren, vorschau } from "@/lib/bild";

// Foto aufnehmen / austauschen / entfernen. art: "tool" | "vehicle" | "material"
export default function FotoKnopf({ art, id, hatBild, onFertig, melde }) {
  const [arbeitet, setArbeitet] = useState(false);

  async function verarbeiten(e) {
    const datei = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!datei) return;
    setArbeitet(true);
    try {
      const g = await komprimieren(datei, { kante: 1280, guete: 0.72, maxBytes: 250 * 1024 });
      const gross = g.url;
      const thumb = vorschau(g.quelle, 120, 0.6).url;
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ art, id, thumb, gross }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.fehler || "Fehlgeschlagen");
      await onFertig();
      melde && melde("Foto gespeichert");
    } catch (err) {
      melde && melde("Foto konnte nicht gespeichert werden", "fehler");
    }
    setArbeitet(false);
  }

  async function entfernen() {
    setArbeitet(true);
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ art, id }),
      });
      await onFertig();
      melde && melde("Foto entfernt");
    } catch (e) {
      melde && melde("Foto konnte nicht entfernt werden", "fehler");
    }
    setArbeitet(false);
  }

  return (
    <div className="reihe umbruch">
      <label className={"knopf sekundaer" + (arbeitet ? " deaktiviert" : "")} style={{ cursor: arbeitet ? "wait" : "pointer" }}>
        <Icon name="kamera" groesse={18} />
        {arbeitet ? "Einen Moment …" : hatBild ? "Foto ersetzen" : "Foto hinzufügen"}
        <input type="file" accept="image/*" capture="environment" onChange={verarbeiten} disabled={arbeitet} hidden />
      </label>
      {hatBild && !arbeitet && <button className="knopf gefahr-leise" onClick={entfernen}>Foto entfernen</button>}
    </div>
  );
}
