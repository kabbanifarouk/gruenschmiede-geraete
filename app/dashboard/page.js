"use client";
import { useState } from "react";
import { useDaten } from "@/components/DatenKontext";
import Bestandsleiste from "@/components/Bestandsleiste";
import OrtBlock from "@/components/OrtBlock";
import Filter from "@/components/Filter";
import { zaehle } from "@/lib/format";

export default function Uebersicht() {
  const { vehicles, tools, laden } = useDaten();
  const [f, setF] = useState("alle");

  if (laden) return <div className="hinweis">Wird geladen …</div>;

  const orte = [{ id: "lager", name: "Lager / Betriebshof", kennzeichen: "" }, ...vehicles];
  const sichtbar = f === "alle" ? orte : orte.filter((o) => o.id !== "lager" && (o.status || "ok") === f);

  return (
    <div>
      <Bestandsleiste tools={tools} />
      <h3>Wo steht was</h3>
      {vehicles.length > 0 && <Filter wert={f} setzen={setF} zaehler={zaehle(vehicles)} />}
      {!sichtbar.length && <div className="hinweis">Kein Fahrzeug in diesem Zustand.</div>}
      <div className="liste weit">
        {sichtbar.map((o) => <OrtBlock key={o.id} ort={o} tools={tools} />)}
      </div>
    </div>
  );
}
