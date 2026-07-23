"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDaten } from "@/components/DatenKontext";
import { Bild, Grossbild, BildFeld } from "@/components/Bild";
import Verlauf from "@/components/Verlauf";
import { STATUS, artFuer, pruefStatus, zeigeDatum, heuteISO } from "@/lib/format";
import { api } from "@/lib/api";

export default function GeraetSeite() {
  const { id } = useParams();
  const router = useRouter();
  const { vehicles, tools, laden, istAdmin, neuLaden, melde } = useDaten();
  const [modus, setModus] = useState(null);
  const [text, setText] = useState("");
  const [neuerStatus, setNeuerStatus] = useState("defekt");

  if (laden) return <div className="hinweis">Wird geladen …</div>;

  const tool = tools.find((t) => t.id === id);
  if (!tool) return <div className="hinweis">Gerät nicht gefunden.</div>;

  const orte = [{ id: "lager", name: "Lager / Betriebshof" }, ...vehicles];
  const ortName = (oid) => (orte.find((o) => o.id === oid) || {}).name || "Unbekannt";
  const st = STATUS[tool.status] || STATUS.ok;
  const p = pruefStatus(tool);

  async function umbuchen(zielId) {
    await api.toolPatch(tool.id, { ort_id: zielId, logtext: "Umgebucht nach " + ortName(zielId) });
    await neuLaden();
    melde("Umgebucht nach " + ortName(zielId));
    setModus(null);
  }

  async function schadenSenden() {
    await api.toolPatch(tool.id, { status: neuerStatus, notiz: text, logtext: STATUS[neuerStatus].label + (text ? ": " + text : "") });
    await neuLaden();
    melde("Meldung gespeichert");
    setModus(null);
  }

  return (
    <div>
      <Link href="/dashboard" className="zurueck">← Übersicht</Link>

      <Grossbild url={tool.foto_url} vorhanden={!!tool.hat_bild} />

      <div className="schild">
        <span className="schildband" style={{ "--bf": st.band }} />
        <div className="schildinhalt">
          <div className="schildkopf">
            <span className="schildsymbol"><Bild thumb={tool.thumb} art={artFuer(tool)} groesse={34} /></span>
            <span className="schildname">{tool.name}</span>
            <span className="punkt" style={{ background: st.band }} />
          </div>
          <div className="standort"><span>Aktuell: <strong>{ortName(tool.ort_id)}</strong></span></div>
          <dl className="daten">
            <div><dt>Zustand</dt><dd style={{ color: st.text, fontWeight: 700 }}>{st.label}</dd></div>
            <div><dt>Inventarnr.</dt><dd className="mono">{tool.inv_nr || "—"}</dd></div>
            <div><dt>Kategorie</dt><dd>{tool.kategorie || "—"}</dd></div>
            <div><dt>Letzte Prüfung</dt><dd className="mono">{zeigeDatum(tool.geprueft)}</dd></div>
          </dl>
          {tool.notiz && <div className="notizanzeige">{tool.notiz}</div>}
          {p && <div className={"pfrist zeile" + (p.tage < 0 ? " ueber" : "")}>Nächste Prüfung: {zeigeDatum(p.datum)}</div>}
        </div>
      </div>

      {modus === null && (
        <div className="aktionen">
          <button className="primaer" onClick={() => setModus("umbuchen")}>Umbuchen</button>
          <button className="warnknopf" onClick={() => { setModus("schaden"); setText(tool.notiz || ""); }}>Schaden melden</button>
        </div>
      )}

      {modus === "umbuchen" && (
        <div className="block">
          <label className="feldlabel">Wohin?</label>
          <div className="liste">
            {orte.filter((o) => o.id !== tool.ort_id).map((o) => (
              <button key={o.id} className="zielknopf" onClick={() => umbuchen(o.id)}>
                <Bild thumb={o.thumb} art={o.id === "lager" ? "halle" : "transporter"} groesse={24} />
                <span>{o.name}{o.kennzeichen ? ` · ${o.kennzeichen}` : ""}</span>
              </button>
            ))}
          </div>
          <button className="sekundaer breit" onClick={() => setModus(null)}>Abbrechen</button>
        </div>
      )}

      {modus === "schaden" && (
        <div className="block">
          <label className="feldlabel">Was ist los?</label>
          <div className="statusreihe">
            {["wartung", "defekt", "weg"].map((k) => (
              <button key={k} className="statusknopf"
                style={neuerStatus === k ? { background: STATUS[k].band, borderColor: STATUS[k].band, color: "#fff" } : { borderColor: STATUS[k].band, color: STATUS[k].text }}
                onClick={() => setNeuerStatus(k)}>{STATUS[k].label}</button>
            ))}
          </div>
          <label className="feldlabel">Kurz beschreiben</label>
          <textarea className="notiz" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Startet nicht mehr, Seilzug gerissen" />
          <button className="warnknopf breit" onClick={schadenSenden}>Meldung absenden</button>
          <button className="sekundaer breit" onClick={() => setModus(null)}>Abbrechen</button>
        </div>
      )}

      {istAdmin && modus === null && (
        <div className="adminblock">
          <h3>Admin</h3>
          <button className="sekundaer breit" onClick={async () => { await api.toolPatch(tool.id, { status: "ok", notiz: "", logtext: "Repariert / freigegeben" }); await neuLaden(); }}>
            Als einsatzbereit freigeben
          </button>
          <button className="sekundaer breit" onClick={async () => { await api.toolPatch(tool.id, { geprueft: heuteISO(), logtext: "Geprüft" }); await neuLaden(); }}>
            Prüfung heute eintragen
          </button>
          <label className="feldlabel">Prüfintervall in Monaten</label>
          <input className="feld" inputMode="numeric" defaultValue={tool.intervall_monate || ""} placeholder="z. B. 12"
            onBlur={async (e) => { const v = e.target.value.replace(/\D/g, ""); await api.toolPatch(tool.id, { intervall_monate: v ? Number(v) : null }); await neuLaden(); }} />
          <label className="feldlabel">Bild</label>
          <BildFeld art="tool" id={tool.id} hatBild={!!tool.hat_bild} onFertig={async () => { await neuLaden(); }} />
          <button className="loeschen" onClick={async () => { if (confirm("Gerät wirklich löschen?")) { await api.toolLoeschen(tool.id); router.push("/dashboard"); } }}>
            Gerät löschen
          </button>
        </div>
      )}

      <Verlauf log={tool.log} istAdmin={istAdmin} onLeeren={async () => { await api.toolPatch(tool.id, { logtext: null }); await neuLaden(); }} />
    </div>
  );
}
