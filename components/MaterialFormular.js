"use client";
import { useState } from "react";
import { Feld, Kachel } from "./ui";
import { EINHEITEN, MATERIAL_KATEGORIEN, artFuerMaterial, vergleich } from "@/lib/format";

const zahlFeld = (v) => (v === null || v === undefined ? "" : String(v).replace(".", ","));
const nurZahl = (v) => v.replace(/[^\d.,]/g, "");

export function leeresMaterial(m = {}) {
  return {
    name: m.name || "",
    kategorie: m.kategorie || "",
    einheit: m.einheit || "Sack",
    bestand: zahlFeld(m.bestand ?? ""),
    mindestbestand: zahlFeld(m.mindestbestand),
    lagerort: m.lagerort || "",
    artikel_nr: m.artikel_nr || "",
    preis: zahlFeld(m.preis),
    notiz: m.notiz || "",
  };
}

// Felder eines Lagerartikels. mitBestand: Anfangsbestand abfragen (nur beim Anlegen)
export default function MaterialFormular({ f, setF, mitBestand, materials = [] }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const kategorien = Array.from(new Set([...MATERIAL_KATEGORIEN, ...materials.map((m) => m.kategorie).filter(Boolean)])).sort(vergleich);
  const einheiten = Array.from(new Set([...EINHEITEN, ...materials.map((m) => m.einheit).filter(Boolean)]));
  const [alleKat, setAlleKat] = useState(false);
  const sichtbareKat = alleKat ? kategorien : kategorien.slice(0, 8);
  const lagerorte = Array.from(new Set(materials.map((m) => m.lagerort).filter(Boolean))).sort(vergleich);

  return (
    <div>
      <div className="reihe" style={{ marginBottom: 18, gap: 14 }}>
        <Kachel art={artFuerMaterial(f)} groesse="gross" />
        <div className="zeile-mitte">
          <span className="titel-m">{f.name || "Neues Material"}</span>
          <span className="leise klein">{f.kategorie || "Ohne Kategorie"}</span>
        </div>
      </div>

      <Feld label="Bezeichnung">
        <input className="eingabe" value={f.name} onChange={set("name")} placeholder="z. B. Estrichbeton C20/25, 40 kg" autoFocus={mitBestand} />
      </Feld>

      <div className="feld">
        <span className="feld-label">Kategorie</span>
        <input className="eingabe" value={f.kategorie} onChange={set("kategorie")} placeholder="Wählen oder eigene eingeben" />
        <div className="vorschlaege">
          {sichtbareKat.map((k) => (
            <button type="button" key={k} className={"vorschlag" + (f.kategorie === k ? " aktiv" : "")} onClick={() => setF({ ...f, kategorie: f.kategorie === k ? "" : k })}>{k}</button>
          ))}
          {kategorien.length > 8 && (
            <button type="button" className="vorschlag" onClick={() => setAlleKat(!alleKat)}>{alleKat ? "Weniger" : `+ ${kategorien.length - 8} weitere`}</button>
          )}
        </div>
      </div>

      <div className="feld">
        <span className="feld-label">Einheit</span>
        <div className="vorschlaege">
          {einheiten.map((k) => (
            <button type="button" key={k} className={"vorschlag" + (f.einheit === k ? " aktiv" : "")} onClick={() => setF({ ...f, einheit: k })}>{k}</button>
          ))}
        </div>
        <input className="eingabe" style={{ marginTop: 6 }} value={einheiten.includes(f.einheit) ? "" : f.einheit} onChange={(e) => setF({ ...f, einheit: e.target.value })} placeholder="Andere Einheit, z. B. Bund" />
      </div>

      <div className="feldreihe">
        {mitBestand && (
          <Feld label="Aktueller Bestand" hilfe="Wie viel ist jetzt da?">
            <span className="eingabe-gruppe">
              <input className="eingabe" style={{ paddingLeft: 13 }} inputMode="decimal" value={f.bestand} onChange={(e) => setF({ ...f, bestand: nurZahl(e.target.value) })} placeholder="0" />
              <span className="eingabe-suffix">{f.einheit}</span>
            </span>
          </Feld>
        )}
        <Feld label="Mindestbestand" hilfe="Darunter wird es als knapp gemeldet">
          <span className="eingabe-gruppe">
            <input className="eingabe" style={{ paddingLeft: 13 }} inputMode="decimal" value={f.mindestbestand} onChange={(e) => setF({ ...f, mindestbestand: nurZahl(e.target.value) })} placeholder="optional" />
            <span className="eingabe-suffix">{f.einheit}</span>
          </span>
        </Feld>
        {!mitBestand && (
          <Feld label="Einkaufspreis je Einheit" hilfe="Für den Lagerwert">
            <span className="eingabe-gruppe">
              <input className="eingabe" style={{ paddingLeft: 13 }} inputMode="decimal" value={f.preis} onChange={(e) => setF({ ...f, preis: nurZahl(e.target.value) })} placeholder="optional" />
              <span className="eingabe-suffix">€</span>
            </span>
          </Feld>
        )}
      </div>

      <div className="feldreihe">
        <Feld label="Lagerplatz">
          <input className="eingabe" value={f.lagerort} onChange={set("lagerort")} placeholder="z. B. Halle, Regal 3" list="lagerorte" />
          <datalist id="lagerorte">{lagerorte.map((o) => <option key={o} value={o} />)}</datalist>
        </Feld>
        {mitBestand ? (
          <Feld label="Einkaufspreis je Einheit" hilfe="Für den Lagerwert">
            <span className="eingabe-gruppe">
              <input className="eingabe" style={{ paddingLeft: 13 }} inputMode="decimal" value={f.preis} onChange={(e) => setF({ ...f, preis: nurZahl(e.target.value) })} placeholder="optional" />
              <span className="eingabe-suffix">€</span>
            </span>
          </Feld>
        ) : (
          <Feld label="Artikelnummer"><input className="eingabe" value={f.artikel_nr} onChange={set("artikel_nr")} placeholder="optional" /></Feld>
        )}
      </div>
      {mitBestand && <Feld label="Artikelnummer"><input className="eingabe" value={f.artikel_nr} onChange={set("artikel_nr")} placeholder="optional, z. B. vom Lieferanten" /></Feld>}
      <Feld label="Notiz"><textarea className="eingabe" rows={2} value={f.notiz} onChange={set("notiz")} placeholder="z. B. Lieferant, Farbe, Format" /></Feld>
    </div>
  );
}
