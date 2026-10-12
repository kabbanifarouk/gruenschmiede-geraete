"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import BuchenDialog from "@/components/BuchenDialog";
import { useDaten } from "@/components/DatenKontext";
import { Fuellstand, Kachel, Laden, Leer, Seitenkopf, Segment, Suche } from "@/components/ui";
import { artFuerMaterial, bestandsLage, euro, passtSuche, vergleich, zahlText } from "@/lib/format";
import { api } from "@/lib/api";

export default function LagerSeite() {
  const params = useSearchParams();
  const { materials, laden, istAdmin, neuLaden, melde } = useDaten();
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState(params.get("filter") || "alle");
  const [ansicht, setAnsicht] = useState("kategorie");
  const [buchen, setBuchen] = useState(null); // { material, art }

  if (laden) return <Laden />;

  const knappListe = materials.filter((m) => bestandsLage(m) !== "ok");
  const kategorien = Array.from(new Set(materials.map((m) => m.kategorie || "Ohne Kategorie"))).sort(vergleich);
  const lagerwert = materials.reduce((s, m) => s + (m.preis ? Number(m.preis) * Number(m.bestand || 0) : 0), 0);

  const gefiltert = materials
    .filter((m) => filter === "alle" || (filter === "knapp" ? bestandsLage(m) !== "ok" : (m.kategorie || "Ohne Kategorie") === filter))
    .filter((m) => passtSuche(`${m.name} ${m.kategorie} ${m.lagerort} ${m.artikel_nr}`, suche))
    .sort((a, b) => (ansicht === "kategorie" ? vergleich(a.kategorie || "~", b.kategorie || "~") : 0) || vergleich(a.name, b.name));

  async function gebucht(art, menge, notiz, auftragId) {
    await api.materialBuchen(buchen.material.id, art, menge, notiz, auftragId);
    await neuLaden();
    melde(art === "abgang" ? "Entnahme gebucht" : art === "zugang" ? "Zugang gebucht" : "Bestand korrigiert");
    setBuchen(null);
  }

  const sub = [`${materials.length} Artikel`];
  if (knappListe.length) sub.push(`${knappListe.length} knapp`);
  if (lagerwert > 0) sub.push(`Lagerwert ${euro(lagerwert)}`);

  let letzte = null;
  return (
    <div>
      <Seitenkopf titel="Lager" sub={sub.join(", ")}
        aktionen={istAdmin && <Link href="/dashboard/lager/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Material anlegen</Link>} />

      {materials.length > 0 && (
        <>
          <div className="werkzeugleiste">
            <Suche wert={suche} setzen={setSuche} platzhalter="Material suchen …" />
            <div className="nur-desktop"><Segment optionen={[["kategorie", "Nach Kategorie"], ["name", "A–Z"]]} wert={ansicht} setzen={setAnsicht} /></div>
          </div>
          <div className="chips" style={{ marginBottom: 14 }}>
            <button className={"chip" + (filter === "alle" ? " aktiv" : "")} onClick={() => setFilter("alle")}>Alle<span className="chip-zahl">{materials.length}</span></button>
            {(knappListe.length > 0 || filter === "knapp") && (
              <button className={"chip" + (filter === "knapp" ? " aktiv" : "")} onClick={() => setFilter("knapp")}>
                <Icon name="warnung" groesse={14} />Knapp<span className="chip-zahl">{knappListe.length}</span>
              </button>
            )}
            {kategorien.map((k) => (
              <button key={k} className={"chip" + (filter === k ? " aktiv" : "")} onClick={() => setFilter(k)}>
                {k}<span className="chip-zahl">{materials.filter((m) => (m.kategorie || "Ohne Kategorie") === k).length}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="karte">
        {!materials.length ? (
          <Leer icon="lager" titel="Noch kein Material im Lager" text="Lege Betonsäcke, Pflastersteine, Splitt, Rasensaat und alles andere an. So weißt du jederzeit, was noch da ist und wann nachbestellt werden muss.">
            {istAdmin && <Link href="/dashboard/lager/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Erstes Material anlegen</Link>}
          </Leer>
        ) : !gefiltert.length ? (
          <Leer icon="suche" titel="Keine Treffer" text="Passe die Suche oder den Filter an.">
            <button className="knopf sekundaer" onClick={() => { setSuche(""); setFilter("alle"); }}>Filter zurücksetzen</button>
          </Leer>
        ) : (
          <div className="liste-zeilen">
            {gefiltert.map((m) => {
              const g = ansicht === "kategorie" && filter === "alle" ? (m.kategorie || "Ohne Kategorie") : null;
              const neu = g !== null && g !== letzte;
              if (neu) letzte = g;
              const lage = bestandsLage(m);
              return (
                <Fragment key={m.id}>
                  {neu && <div className="gruppen-titel">{g}</div>}
                  <div className="zeile" style={{ position: "relative" }}>
                    <Link href={`/dashboard/lager/${m.id}`} style={{ position: "absolute", inset: 0 }} aria-label={m.name} />
                    <Kachel thumb={m.thumb} art={artFuerMaterial(m)} />
                    <span className="zeile-mitte">
                      <span className="zeile-titel">{m.name}</span>
                      <span className="zeile-sub">
                        {lage === "leer" && <span className="ueberfaellig">Nicht auf Lager</span>}
                        {lage === "knapp" && <span className="bald">Knapp</span>}
                        {m.lagerort && <span><Icon name="ort" groesse={14} />{m.lagerort}</span>}
                        {m.mindestbestand !== null && <span className="nur-desktop">Min. {zahlText(m.mindestbestand)} {m.einheit}</span>}
                      </span>
                    </span>
                    <span className="lager-bestand">
                      <span className={"bestand-zahl " + (lage === "ok" ? "" : "ist-" + lage)}>{zahlText(m.bestand)}<span className="bestand-einheit">{m.einheit}</span></span>
                      <Fuellstand m={m} />
                    </span>
                    <span className="lager-knoepfe" style={{ position: "relative" }}>
                      <button className="knopf sekundaer" title="Entnehmen" aria-label={`${m.name} entnehmen`} onClick={() => setBuchen({ material: m, art: "abgang" })} disabled={Number(m.bestand) <= 0}><Icon name="minus" groesse={18} /></button>
                      <button className="knopf sekundaer" title="Zugang buchen" aria-label={`Zugang für ${m.name} buchen`} onClick={() => setBuchen({ material: m, art: "zugang" })}><Icon name="plus" groesse={18} /></button>
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      {buchen && <BuchenDialog material={buchen.material} startArt={buchen.art} istAdmin={istAdmin} onClose={() => setBuchen(null)} onBuchen={gebucht} />}
    </div>
  );
}
