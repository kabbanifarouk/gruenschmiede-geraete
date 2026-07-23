"use client";
import { STATUS } from "@/lib/format";

export default function Filter({ wert, setzen, zaehler }) {
  const opts = [["alle", "Alle"], ["ok", "Einsatzbereit"], ["wartung", "Wartung"], ["defekt", "Defekt"], ["weg", "Vermisst"]];
  return (
    <div className="filter">
      {opts.map(([k, l]) => {
        const n = zaehler[k] || 0;
        const aktiv = wert === k;
        if (k !== "alle" && n === 0 && !aktiv) return null;
        const farbe = k === "alle" ? null : STATUS[k].band;
        const stil = aktiv
          ? (farbe ? { background: farbe, borderColor: farbe, color: "#fff" } : { background: "#15181A", borderColor: "#15181A", color: "#fff" })
          : (farbe ? { borderColor: farbe, color: STATUS[k].text } : undefined);
        return (
          <button key={k} className={"chip" + (aktiv ? " aktiv" : "")} style={stil} onClick={() => setzen(k)}>
            {l}<span className="chipzahl">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
