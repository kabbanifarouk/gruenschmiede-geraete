"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDaten } from "@/components/DatenKontext";
import { Bild, BildFeld } from "@/components/Bild";
import Zeile from "@/components/Zeile";
import Verlauf from "@/components/Verlauf";
import { STATUS, zeigeDatum } from "@/lib/format";
import { api } from "@/lib/api";

export default function OrtSeite() {
  const { id } = useParams();
  const { vehicles, tools, laden, istAdmin, neuLaden, melde } = useDaten();

  const [modus, setModus] = useState(null);
  const [text, setText] = useState("");
  const [neuerStatus, setNeuerStatus] = useState("wartung");
  const [frist, setFrist] = useState("");

  if (laden) return <div className="hinweis">Wird geladen …</div>;

  const ort = id === "lager" ? { id: "lager", name: "Lager / Betriebshof" } : vehicles.find((v) => v.id === id);
  if (!ort) return <div className="hinweis">Standort nicht gefunden.</div>;

  const istFahrzeug = ort.id !== "lager";
  const drin = tools.filter((t) => t.ort_id === ort.id);
  const fst = STATUS[ort.status || "ok"];
  const tage = ort.faellig ? Math.round((new Date(ort.faellig) - new Date()) / 86400000) : null;
  const ortName = (oid) => (oid === "lager" ? "Lager / Betriebshof" : (vehicles.find((v) => v.id === oid) || {}).name || "Unbekannt");

  function oeffneFormular() {
    setText(ort.notiz || "");
    setNeuerStatus(ort.status && ort.status !== "ok" ? ort.status : "wartung");
    setFrist(ort.faellig || "");
    setModus("melden");
  }

  async function speichern() {
    const logtext = STATUS[neuerStatus].label + (text ? ": " + text : "") + (frist ? " · fällig bis " + zeigeDatum(frist) : "");
    await api.fahrzeugPatch(ort.id, { status: neuerStatus, notiz: text, faellig: frist || null, logtext });
    await neuLaden();
    melde("Fahrzeug aktualisiert");
    setModus(null);
  }

  return (
    <div>
      <Link href="/dashboard" className="zurueck">← Übersicht</Link>
      <div className="ortkopf">
        <span className="ortkopfsymbol"><Bild thumb={ort.thumb} art={istFahrzeug ? "transporter" : "halle"} groesse={34} /></span>
        <div>
          <h2>{ort.name}</h2>
          {ort.kennzeichen && <div className="kennz gross">{ort.kennzeichen}</div>}
          <div className="unterzeile">{drin.length} Geräte an Bord</div>
        </div>
      </div>

      {istFahrzeug && (
        <div className="fzeile">
          <span className="fpunkt" style={{ background: fst.band }} />
          <span className="fztext">
            <strong style={{ color: fst.text }}>{fst.label}</strong>
            {ort.faellig && <span className={"ffrist inline" + (tage < 0 ? " ueber" : "")}>fällig bis {zeigeDatum(ort.faellig)}</span>}
          </span>
          <button className="linkknopf" onClick={() => (modus === "melden" ? setModus(null) : oeffneFormular())}>
            {modus === "melden" ? "Schließen" : "Ändern"}
          </button>
        </div>
      )}

      {istFahrzeug && ort.notiz && modus !== "melden" && <div className="fnotiz">{ort.notiz}</div>}

      {istFahrzeug && modus === "melden" && (
        <div className="block formkasten">
          <label className="feldlabel oben">Zustand des Fahrzeugs</label>
          <div className="statusreihe">
            {["ok", "wartung", "defekt", "weg"].map((k) => (
              <button key={k} className="statusknopf"
                style={neuerStatus === k ? { background: STATUS[k].band, borderColor: STATUS[k].band, color: "#fff" } : { borderColor: STATUS[k].band, color: STATUS[k].text }}
                onClick={() => setNeuerStatus(k)}>{STATUS[k].label}</button>
            ))}
          </div>
          <label className="feldlabel">Kommentar</label>
          <textarea className="notiz" rows={3} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="z. B. Bremse hinten links schleift, TÜV läuft ab" />
          <label className="feldlabel">Fällig bis (optional)</label>
          <input className="feld" type="date" value={frist} onChange={(e) => setFrist(e.target.value)} />
          {istAdmin && (
            <>
              <label className="feldlabel">Bild</label>
              <BildFeld art="vehicle" id={ort.id} hatBild={!!ort.hat_bild} onFertig={async () => { await neuLaden(); }} />
            </>
          )}
          <button className="primaer breit" onClick={speichern}>Speichern</button>
          <button className="sekundaer breit" onClick={() => setModus(null)}>Abbrechen</button>
        </div>
      )}

      <h3>Geräte an Bord</h3>
      {!drin.length && <div className="hinweis">Hier ist noch nichts erfasst.</div>}
      <div className="liste">{drin.map((t) => <Zeile key={t.id} t={t} ortName={ortName} zeigeOrt={false} />)}</div>
      {istAdmin && (
        <Link href={`/dashboard/geraete/neu?ort=${ort.id}`} className="zufuegen">+ Gerät erfassen</Link>
      )}

      {istFahrzeug && (
        <Verlauf
          log={ort.log}
          istAdmin={istAdmin}
          onLeeren={async () => { await api.fahrzeugPatch(ort.id, { logtext: null }); await neuLaden(); }}
        />
      )}
    </div>
  );
}
