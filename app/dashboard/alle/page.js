"use client";
import { useState, Fragment } from "react";
import { useDaten } from "@/components/DatenKontext";
import Bestandsleiste from "@/components/Bestandsleiste";
import Zeile from "@/components/Zeile";
import Filter from "@/components/Filter";
import { STATUS, zaehle } from "@/lib/format";

export default function AlleGeraete() {
  const { vehicles, tools, laden } = useDaten();
  const [sortierung, setSortierung] = useState("name");
  const [f, setF] = useState("alle");

  if (laden) return <div className="hinweis">Wird geladen …</div>;

  const orte = [{ id: "lager", name: "Lager / Betriebshof" }, ...vehicles];
  const ortName = (id) => (orte.find((o) => o.id === id) || {}).name || "Unbekannt";
  const rang = { defekt: 0, weg: 1, wartung: 2, ok: 3 };
  const nachName = (a, b) => (a.name || "").localeCompare(b.name || "", "de");
  const gefiltert = f === "alle" ? tools : tools.filter((t) => (t.status || "ok") === f);
  const sortiert = [...gefiltert].sort((a, b) => {
    if (sortierung === "ort") return ortName(a.ort_id).localeCompare(ortName(b.ort_id), "de") || nachName(a, b);
    if (sortierung === "zustand") return (rang[a.status] ?? 3) - (rang[b.status] ?? 3) || nachName(a, b);
    return nachName(a, b);
  });

  let letzte = null;
  return (
    <div>
      <Bestandsleiste tools={tools} />
      <h3>Alle Geräte</h3>
      <Filter wert={f} setzen={setF} zaehler={zaehle(tools)} />
      <div className="sortierung">
        {[["name", "A–Z"], ["ort", "Nach Standort"], ["zustand", "Nach Zustand"]].map(([k, l]) => (
          <button key={k} className={"sortknopf" + (sortierung === k ? " aktiv" : "")} onClick={() => setSortierung(k)}>{l}</button>
        ))}
      </div>
      {!tools.length && <div className="hinweis">Noch kein Gerät erfasst.</div>}
      {tools.length > 0 && !sortiert.length && <div className="hinweis">Kein Gerät in diesem Zustand. Gut so.</div>}
      <div className="liste">
        {sortiert.map((t) => {
          const gruppe = sortierung === "ort" ? ortName(t.ort_id) : sortierung === "zustand" ? (STATUS[t.status] || STATUS.ok).label : null;
          const neu = gruppe && gruppe !== letzte;
          if (neu) letzte = gruppe;
          return (
            <Fragment key={t.id}>
              {neu && <div className="gruppentitel">{gruppe}</div>}
              <Zeile t={t} ortName={ortName} zeigeOrt={sortierung !== "ort"} />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
