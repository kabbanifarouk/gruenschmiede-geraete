"use client";
import { Fragment, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { Kachel, Laden, Leer, Seitenkopf, Segment, Status, Suche } from "@/components/ui";
import { LAGER, STATUS, artFuer, fristText, passtSuche, pruefStatus, vergleich } from "@/lib/format";

const FILTER = [
  ["alle", "Alle"],
  ["auffaellig", "Auffällig"],
  ["ok", "Einsatzbereit"],
  ["defekt", "Defekt"],
  ["wartung", "Wartung"],
  ["weg", "Vermisst"],
  ["pruefung", "Prüfung fällig"],
];

export default function GeraeteListe() {
  const params = useSearchParams();
  const { vehicles, tools, laden, istAdmin } = useDaten();
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState(params.get("zustand") || "alle");
  const [sortierung, setSortierung] = useState("name");

  if (laden) return <Laden />;

  const orte = [LAGER, ...vehicles];
  const ortName = (id) => (orte.find((o) => o.id === id) || {}).name || "Unbekannt";
  const rang = { defekt: 0, weg: 1, wartung: 2, ok: 3 };

  const test = {
    alle: () => true,
    auffaellig: (t) => (t.status || "ok") !== "ok",
    pruefung: (t) => { const p = pruefStatus(t); return p && p.tage <= 30; },
  };
  const zaehl = (k) => tools.filter(test[k] || ((t) => (t.status || "ok") === k)).length;

  const gefiltert = tools
    .filter(test[filter] || ((t) => (t.status || "ok") === filter))
    .filter((t) => passtSuche(`${t.name} ${t.kategorie} ${t.inv_nr} ${t.serien_nr} ${ortName(t.ort_id)}`, suche));

  const sortiert = [...gefiltert].sort((a, b) => {
    if (sortierung === "ort") return vergleich(ortName(a.ort_id), ortName(b.ort_id)) || vergleich(a.name, b.name);
    if (sortierung === "zustand") return (rang[a.status] ?? 3) - (rang[b.status] ?? 3) || vergleich(a.name, b.name);
    if (sortierung === "kategorie") return vergleich(a.kategorie || "~", b.kategorie || "~") || vergleich(a.name, b.name);
    return vergleich(a.name, b.name);
  });

  const gruppeVon = (t) => {
    if (sortierung === "ort") return ortName(t.ort_id);
    if (sortierung === "zustand") return (STATUS[t.status] || STATUS.ok).label;
    if (sortierung === "kategorie") return t.kategorie || "Ohne Kategorie";
    return null;
  };

  let letzte = null;
  return (
    <div>
      <Seitenkopf
        titel="Geräte"
        sub={`${tools.length} Geräte, ${zaehl("auffaellig")} davon auffällig`}
        aktionen={istAdmin && <Link href="/dashboard/geraete/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Gerät erfassen</Link>}
      />

      <div className="werkzeugleiste">
        <Suche wert={suche} setzen={setSuche} platzhalter="Name, Inventarnummer, Kategorie …" />
        <div className="nur-desktop">
          <Segment optionen={[["name", "A–Z"], ["kategorie", "Kategorie"], ["ort", "Standort"], ["zustand", "Zustand"]]} wert={sortierung} setzen={setSortierung} />
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {FILTER.map(([k, l]) => {
          const n = zaehl(k);
          if (k !== "alle" && k !== filter && n === 0) return null;
          return (
            <button key={k} className={"chip" + (filter === k ? " aktiv" : "")} onClick={() => setFilter(k)}>
              {l}<span className="chip-zahl">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="nur-mobil" style={{ marginBottom: 12 }}>
        <Segment breit optionen={[["name", "A–Z"], ["kategorie", "Kategorie"], ["ort", "Standort"], ["zustand", "Zustand"]]} wert={sortierung} setzen={setSortierung} />
      </div>

      <div className="karte">
        {!tools.length ? (
          <Leer icon="werkzeug" titel="Noch keine Geräte erfasst" text="Erfasse Motorsägen, Mäher, Anhänger und alles andere, damit jeder sieht, wo es gerade ist.">
            {istAdmin && <Link href="/dashboard/geraete/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Erstes Gerät erfassen</Link>}
          </Leer>
        ) : !sortiert.length ? (
          <Leer icon="suche" titel="Keine Treffer" text="Passe die Suche oder den Filter an.">
            <button className="knopf sekundaer" onClick={() => { setSuche(""); setFilter("alle"); }}>Filter zurücksetzen</button>
          </Leer>
        ) : (
          <div className="liste-zeilen">
            {sortiert.map((t) => {
              const g = gruppeVon(t);
              const neu = g !== null && g !== letzte;
              if (neu) letzte = g;
              const p = pruefStatus(t);
              return (
                <Fragment key={t.id}>
                  {neu && <div className="gruppen-titel">{g}</div>}
                  <Link href={`/dashboard/geraete/${t.id}`} className="zeile">
                    <Kachel thumb={t.thumb} art={artFuer(t)} />
                    <span className="zeile-mitte">
                      <span className="zeile-titel">{t.name}</span>
                      <span className="zeile-sub">
                        {t.inv_nr && <span className="marke-klein">{t.inv_nr}</span>}
                        {sortierung !== "ort" && <span><Icon name="ort" groesse={14} />{ortName(t.ort_id)}</span>}
                        {sortierung !== "kategorie" && t.kategorie && <span className="nur-desktop">{t.kategorie}</span>}
                        {p && p.tage <= 30 && <span className={p.tage < 0 ? "ueberfaellig" : "bald"}>Prüfung {fristText(p.tage)}</span>}
                      </span>
                    </span>
                    <span className="zeile-rechts">
                      {sortierung !== "zustand" && <Status status={t.status} kurz />}
                      <Icon name="weiter" groesse={18} className="chevron" />
                    </span>
                  </Link>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
