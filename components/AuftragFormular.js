"use client";
import { Feld } from "./ui";
import { vergleich } from "@/lib/format";

export function leererAuftrag(a = {}) {
  return {
    titel: a.titel || "", kunde: a.kunde || "", telefon: a.telefon || "",
    adresse: a.adresse || "", notiz: a.notiz || "", status: a.status || "geplant",
  };
}

// Felder eines Auftrags. Bekannte Kunden werden vorgeschlagen und füllen Adresse/Telefon.
export default function AuftragFormular({ f, setF, auftraege = [], mitStatus }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const kunden = new Map();
  auftraege.forEach((a) => { if (a.kunde && !kunden.has(a.kunde)) kunden.set(a.kunde, a); });
  const kundenNamen = [...kunden.keys()].sort(vergleich);

  function kundeAendern(v) {
    const bekannt = kunden.get(v);
    setF({
      ...f, kunde: v,
      adresse: bekannt && !f.adresse ? bekannt.adresse : f.adresse,
      telefon: bekannt && !f.telefon ? bekannt.telefon : f.telefon,
    });
  }

  return (
    <div>
      <Feld label="Was wird gemacht?">
        <input className="eingabe" value={f.titel} onChange={set("titel")} placeholder="z. B. Pflasterarbeiten Einfahrt" autoFocus={mitStatus} />
      </Feld>
      <Feld label="Kunde" hilfe={kundenNamen.length ? "Bekannte Kunden werden vorgeschlagen" : null}>
        <input className="eingabe" value={f.kunde} onChange={(e) => kundeAendern(e.target.value)} placeholder="z. B. Familie Müller" list="kundenliste" autoComplete="off" />
        <datalist id="kundenliste">{kundenNamen.map((k) => <option key={k} value={k} />)}</datalist>
      </Feld>
      <Feld label="Adresse der Baustelle">
        <textarea className="eingabe" rows={2} value={f.adresse} onChange={set("adresse")} placeholder={"Hauptstraße 12\n54655 Malbergweich"} style={{ minHeight: 70 }} />
      </Feld>
      <Feld label="Telefon">
        <input className="eingabe" type="tel" value={f.telefon} onChange={set("telefon")} placeholder="optional" />
      </Feld>
      {mitStatus && (
        <div className="feld">
          <span className="feld-label">Status</span>
          <div className="vorschlaege">
            {[["geplant", "Geplant"], ["aktiv", "Läuft schon"]].map(([k, l]) => (
              <button type="button" key={k} className={"vorschlag" + (f.status === k ? " aktiv" : "")} onClick={() => setF({ ...f, status: k })}>{l}</button>
            ))}
          </div>
        </div>
      )}
      <Feld label="Notiz" hilfe="z. B. Tor-Code, Ansprechpartner, Besonderheiten">
        <textarea className="eingabe" rows={2} value={f.notiz} onChange={set("notiz")} placeholder="optional" style={{ minHeight: 70 }} />
      </Feld>
    </div>
  );
}
