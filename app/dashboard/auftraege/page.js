"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { Laden, Leer, Seitenkopf, Suche } from "@/components/ui";
import { AUFTRAG_STATUS, dauer, passtSuche, tagText } from "@/lib/format";

const FILTER = [["offen", "Offen"], ["aktiv", "In Arbeit"], ["geplant", "Geplant"], ["abgeschlossen", "Abgeschlossen"]];

export default function AuftraegeListe() {
  const { auftraege, laufend, laden, istAdmin } = useDaten();
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("offen");

  if (laden) return <Laden />;

  const rang = { aktiv: 0, geplant: 1, abgeschlossen: 2 };
  const zaehl = (k) => auftraege.filter((a) => (k === "offen" ? a.status !== "abgeschlossen" : a.status === k)).length;
  const liste = auftraege
    .filter((a) => (filter === "offen" ? a.status !== "abgeschlossen" : a.status === filter))
    .filter((a) => passtSuche(`${a.titel} ${a.kunde} ${a.adresse} ${a.nummer}`, suche))
    .sort((a, b) => {
      const la = laufend.some((z) => z.auftrag_id === a.id) ? 0 : 1;
      const lb = laufend.some((z) => z.auftrag_id === b.id) ? 0 : 1;
      return la - lb || rang[a.status] - rang[b.status] || String(b.zuletzt || b.created_at).localeCompare(String(a.zuletzt || a.created_at));
    });

  const sub = [];
  if (zaehl("aktiv")) sub.push(`${zaehl("aktiv")} in Arbeit`);
  if (zaehl("geplant")) sub.push(`${zaehl("geplant")} geplant`);

  return (
    <div>
      <Seitenkopf titel="Aufträge" sub={sub.join(", ") || "Baustellen, Stunden und Material an einem Ort"}
        aktionen={istAdmin && <Link href="/dashboard/auftraege/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Auftrag anlegen</Link>} />

      {auftraege.length > 0 && (
        <div className="werkzeugleiste">
          <Suche wert={suche} setzen={setSuche} platzhalter="Auftrag, Kunde oder Adresse …" />
          <div className="chips">
            {FILTER.map(([k, l]) => (
              <button key={k} className={"chip" + (filter === k ? " aktiv" : "")} onClick={() => setFilter(k)}>{l}<span className="chip-zahl">{zaehl(k)}</span></button>
            ))}
          </div>
        </div>
      )}

      <div className="karte">
        {!auftraege.length ? (
          <Leer icon="baustelle" titel="Noch keine Aufträge" text="Lege eine Baustelle mit Kunde und Adresse an. Dein Team kann dort dann per Start und Stopp die Arbeitszeit erfassen und verbrauchtes Material buchen.">
            {istAdmin && <Link href="/dashboard/auftraege/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Ersten Auftrag anlegen</Link>}
          </Leer>
        ) : !liste.length ? (
          <Leer icon="suche" titel="Keine Aufträge gefunden" text="Passe die Suche oder den Filter an.">
            <button className="knopf sekundaer" onClick={() => { setSuche(""); setFilter("offen"); }}>Filter zurücksetzen</button>
          </Leer>
        ) : (
          <div className="liste-zeilen">
            {liste.map((a) => {
              const vorOrt = laufend.filter((z) => z.auftrag_id === a.id);
              const st = AUFTRAG_STATUS[a.status] || AUFTRAG_STATUS.geplant;
              const ort = (a.adresse || "").split("\n").filter(Boolean).pop();
              return (
                <Link key={a.id} href={`/dashboard/auftraege/${a.id}`} className="zeile">
                  <span className="kachel" style={vorOrt.length ? { background: "var(--gruen-hell)", color: "var(--gruen-tief)" } : undefined}>
                    {vorOrt.length ? <span className="live-punkt" /> : <span className="icon"><Icon name="baustelle" groesse={22} /></span>}
                  </span>
                  <span className="zeile-mitte">
                    <span className="zeile-titel">{a.titel}</span>
                    <span className="zeile-sub">
                      {a.kunde && <span><Icon name="nutzer" groesse={14} />{a.kunde}</span>}
                      {ort && <span className="nur-desktop"><Icon name="ort" groesse={14} />{ort}</span>}
                      {vorOrt.length > 0
                        ? <span style={{ color: "var(--gruen-tief)", fontWeight: 600 }}>{vorOrt.map((z) => z.wer.split(" ")[0]).join(", ")} vor Ort</span>
                        : a.zuletzt && <span className="nur-desktop">Zuletzt: {tagText(a.zuletzt)}</span>}
                    </span>
                  </span>
                  <span className="zeile-rechts">
                    <span className="stapel-s" style={{ alignItems: "flex-end", gap: 4 }}>
                      <span className="stark" style={{ whiteSpace: "nowrap" }}>{dauer(a.minuten)}</span>
                      <span className={"status " + st.klasse}>{st.label}</span>
                    </span>
                    <Icon name="weiter" groesse={18} className="chevron" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
