"use client";
import { useState } from "react";
import Icon from "./Icon";
import { Bestaetigen } from "./ui";

export default function Verlauf({ log, istAdmin, onLeeren }) {
  const [alle, setAlle] = useState(false);
  const [fragen, setFragen] = useState(false);
  const eintraege = log || [];
  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2 className="titel-s reihe" style={{ gap: 8 }}><Icon name="verlauf" groesse={18} className="sehr-leise" />Verlauf</h2>
        {istAdmin && eintraege.length > 0 && <button className="knopf geist klein" onClick={() => setFragen(true)}>Leeren</button>}
      </div>
      {!eintraege.length ? (
        <p className="leise klein" style={{ padding: "0 20px 18px" }}>Noch keine Einträge.</p>
      ) : (
        <ul className="zeitleiste">
          {(alle ? eintraege : eintraege.slice(0, 6)).map((l, i) => (
            <li key={i}>
              <div className="zeit-text">{l.txt}</div>
              <div className="zeit-meta">{l.d}{l.wer ? `, ${l.wer}` : ""}</div>
            </li>
          ))}
        </ul>
      )}
      {eintraege.length > 6 && (
        <div style={{ padding: "0 20px 16px" }}>
          <button className="textlink klein" onClick={() => setAlle(!alle)}>{alle ? "Weniger anzeigen" : `Alle ${eintraege.length} Einträge anzeigen`}</button>
        </div>
      )}
      <Bestaetigen offen={fragen} titel="Verlauf leeren?" text="Alle Einträge werden endgültig gelöscht." knopf="Verlauf leeren"
        onNein={() => setFragen(false)} onJa={() => { setFragen(false); onLeeren(); }} />
    </div>
  );
}
