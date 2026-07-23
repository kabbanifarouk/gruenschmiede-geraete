"use client";
import { useState } from "react";

export default function Verlauf({ log, istAdmin, onLeeren }) {
  const [offen, setOffen] = useState(false);
  const [fragen, setFragen] = useState(false);
  const eintraege = log || [];
  if (!eintraege.length) return null;
  return (
    <div className="verlaufblock">
      <button className="verlaufkopf" onClick={() => { setOffen(!offen); setFragen(false); }}>
        <span className="vtitel">Verlauf</span>
        <span className="vzahl">{eintraege.length}</span>
        <span className="pfeil">{offen ? "▴" : "▾"}</span>
      </button>
      {offen && (
        <div className="verlaufinhalt">
          {eintraege.slice(0, 15).map((l, i) => (
            <div key={i} className="logzeile"><span className="mono">{l.d}</span> {l.txt}{l.wer ? ` · ${l.wer}` : ""}</div>
          ))}
          {eintraege.length > 15 && <div className="logzeile leise">… {eintraege.length - 15} ältere Einträge</div>}
          {istAdmin && !fragen && <button className="linkknopf" onClick={() => setFragen(true)}>Verlauf löschen</button>}
          {istAdmin && fragen && (
            <div className="bestaetigung">
              <div className="btext">Verlauf wirklich löschen? Die Einträge sind danach weg und lassen sich nicht wiederherstellen.</div>
              <div className="aktionen eng">
                <button className="warnknopf" onClick={() => { onLeeren(); setFragen(false); setOffen(false); }}>Ja, löschen</button>
                <button className="sekundaer" onClick={() => setFragen(false)}>Abbrechen</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
