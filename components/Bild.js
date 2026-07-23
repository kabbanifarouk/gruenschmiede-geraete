"use client";
import { useState } from "react";
import Symbol from "./Symbol";

export function Bild({ thumb, art, groesse = 24 }) {
  if (thumb) return <img className="thumb" src={thumb} alt="" style={{ width: groesse, height: groesse }} />;
  return <Symbol art={art} groesse={groesse} />;
}

export function Grossbild({ url, vorhanden }) {
  if (!vorhanden) return null;
  return (
    <div className="banner">
      {url ? <img src={url} alt="" /> : <div className="bannerleer">Bild wird geladen …</div>}
    </div>
  );
}

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

export function BildFeld({ art, id, hatBild, onFertig }) {
  const [arbeitet, setArbeitet] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [fragen, setFragen] = useState(false);

  async function verarbeiten(e) {
    const datei = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!datei) return;
    setFehler(null);
    setArbeitet(true);
    try {
      const bild = await bildLaden(datei);
      const gross = skalieren(bild, 900, 0.72);
      const thumb = ausschnitt(bild, 120, 0.6);
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ art, id, thumb, gross }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.fehler || "Fehlgeschlagen");
      onFertig({ thumb: d.thumb, url: d.url, hatBild: true });
    } catch (err) {
      setFehler("Bild konnte nicht gespeichert werden. Versuch ein kleineres Foto.");
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
    } catch (e) { /* egal, wir setzen den Zustand trotzdem zurück */ }
    onFertig({ thumb: null, url: null, hatBild: false });
    setFragen(false);
    setArbeitet(false);
  }

  return (
    <div className="bildfeld">
      <label className="bildknopf">
        {arbeitet ? "Einen Moment …" : hatBild ? "Bild austauschen" : "Bild aufnehmen oder auswählen"}
        <input type="file" accept="image/*" capture="environment" onChange={verarbeiten} disabled={arbeitet} style={{ display: "none" }} />
      </label>
      {hatBild && !fragen && <button className="linkknopf" onClick={() => setFragen(true)}>Bild entfernen</button>}
      {hatBild && fragen && (
        <div className="bestaetigung">
          <div className="btext">Bild wirklich entfernen?</div>
          <div className="aktionen eng">
            <button className="warnknopf" onClick={entfernen}>Ja, entfernen</button>
            <button className="sekundaer" onClick={() => setFragen(false)}>Abbrechen</button>
          </div>
        </div>
      )}
      {fehler && <div className="fehlertext">{fehler}</div>}
    </div>
  );
}
