"use client";
import { useState } from "react";
import Icon from "./Icon";

function bildLaden(datei) {
  return new Promise((ok, fehler) => {
    const leser = new FileReader();
    leser.onerror = () => fehler(new Error("Datei nicht lesbar"));
    leser.onload = () => {
      const bild = new Image();
      bild.onerror = () => fehler(new Error("Kein gültiges Bild"));
      bild.onload = () => ok(bild);
      bild.src = leser.result;
    };
    leser.readAsDataURL(datei);
  });
}

function skalieren(bild, maxKante, guete) {
  const f = Math.min(1, maxKante / Math.max(bild.width, bild.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bild.width * f));
  c.height = Math.max(1, Math.round(bild.height * f));
  c.getContext("2d").drawImage(bild, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", guete);
}

function ausschnitt(bild, kante, guete) {
  const c = document.createElement("canvas");
  c.width = c.height = kante;
  const k = Math.min(bild.width, bild.height);
  c.getContext("2d").drawImage(bild, (bild.width - k) / 2, (bild.height - k) / 2, k, k, 0, 0, kante, kante);
  return c.toDataURL("image/jpeg", guete);
}

// Foto aufnehmen / austauschen / entfernen. art: "tool" | "vehicle" | "material"
export default function FotoKnopf({ art, id, hatBild, onFertig, melde }) {
  const [arbeitet, setArbeitet] = useState(false);

  async function verarbeiten(e) {
    const datei = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!datei) return;
    setArbeitet(true);
    try {
      const bild = await bildLaden(datei);
      const gross = skalieren(bild, 1200, 0.74);
      const thumb = ausschnitt(bild, 160, 0.62);
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
