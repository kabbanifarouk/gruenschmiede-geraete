"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useDaten } from "./DatenKontext";
import { Bestaetigen, Dialog, Feld, Hinweis } from "./ui";
import { dauer, heuteISO, initialen, uhr, uhrzeit } from "@/lib/format";
import { api } from "@/lib/api";

// Sekunden seit Start, tickt jede Sekunde
export function useLaufzeit(startIso) {
  const { zeitVersatz } = useDaten();
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    if (!startIso) return undefined;
    const t = setInterval(() => setJetzt(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startIso]);
  if (!startIso) return 0;
  return Math.max(0, (jetzt + zeitVersatz - new Date(startIso).getTime()) / 1000);
}

export function Laufzeit({ start, className = "" }) {
  const s = useLaufzeit(start);
  return <span className={className}>{uhr(s)}</span>;
}

// App-weite Leiste: zeigt den eigenen laufenden Timer auf jeder Seite
export function TimerLeiste() {
  const { laufend, auftraege, nutzer, neuLaden, melde } = useDaten();
  const pfad = usePathname();
  const [laeuft, setLaeuft] = useState(false);
  const meiner = laufend.find((z) => z.staff_id === nutzer.id);
  const sek = useLaufzeit(meiner?.start);
  // Auf der Seite des Auftrags selbst zeigt die große Uhr bereits alles
  if (!meiner || pfad === `/dashboard/auftraege/${meiner.auftrag_id}`) return null;
  const auftrag = auftraege.find((a) => a.id === meiner.auftrag_id);

  async function stoppen() {
    setLaeuft(true);
    try {
      const z = await api.timerStoppen(meiner.id);
      await neuLaden();
      melde(`${dauer(z.minuten)} erfasst`);
    } catch (e) { melde(e.message, "fehler"); }
    setLaeuft(false);
  }

  return (
    <div className="timerleiste" role="status">
      <Link href={`/dashboard/auftraege/${meiner.auftrag_id}`} className="timerleiste-text">
        <span className="live-punkt" aria-hidden="true" />
        <span className="zeile-mitte">
          <span className="timerleiste-titel">{auftrag?.titel || "Auftrag"}</span>
          <span className="timerleiste-sub">seit {uhrzeit(meiner.start)} Uhr</span>
        </span>
        <span className="timerleiste-uhr">{uhr(sek)}</span>
      </Link>
      <button className="knopf klein timerleiste-stopp" onClick={stoppen} disabled={laeuft}>
        <Icon name="stopp" groesse={14} />Stopp
      </button>
    </div>
  );
}

// Auswahl, für wen erfasst wird (nur Admins sehen andere Personen)
export function Personenwahl({ wert, setzen }) {
  const { nutzer, istAdmin } = useDaten();
  const [liste, setListe] = useState(null);
  useEffect(() => {
    if (!istAdmin) return;
    api.nutzerListe().then(setListe).catch(() => setListe([]));
  }, [istAdmin]);
  if (!istAdmin) return null;
  if (liste === null) return <div className="sehr-leise klein">Team wird geladen …</div>;
  const umschalten = (id) => setzen(wert.includes(id) ? wert.filter((x) => x !== id) : [...wert, id]);
  return (
    <div className="feld">
      <span className="feld-label">Wer war dabei?</span>
      <div className="personen">
        {liste.map((u) => (
          <button key={u.id} type="button" className={"person" + (wert.includes(u.id) ? " aktiv" : "")} onClick={() => umschalten(u.id)} aria-pressed={wert.includes(u.id)}>
            <span className="avatar hell">{wert.includes(u.id) ? <Icon name="haken" groesse={16} staerke={2.4} /> : initialen(u.name)}</span>
            {u.id === nutzer.id ? "Ich" : u.name.split(" ")[0]}
          </button>
        ))}
      </div>
      {liste.length > 1 && (
        <div className="reihe" style={{ gap: 12 }}>
          <button type="button" className="textlink klein" onClick={() => setzen(liste.map((u) => u.id))}>Alle auswählen</button>
          {wert.length > 0 && <button type="button" className="textlink klein" onClick={() => setzen([])}>Keinen</button>}
        </div>
      )}
    </div>
  );
}

// Timer für mehrere Personen starten (Admin)
export function TeamStartDialog({ auftrag, onClose, onStart }) {
  const { nutzer } = useDaten();
  const [ids, setIds] = useState([nutzer.id]);
  const [laeuft, setLaeuft] = useState(false);
  return (
    <Dialog offen titel="Timer für das Team starten" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf akzent" disabled={!ids.length || laeuft} onClick={async () => { setLaeuft(true); await onStart(ids); setLaeuft(false); }}>
          <Icon name="play" groesse={16} />{ids.length > 1 ? `Für ${ids.length} Personen starten` : "Starten"}
        </button></>}>
      <div className="stapel">
        <p className="leise">Die Zeit läuft für jede ausgewählte Person einzeln und kann auch einzeln gestoppt werden.</p>
        <Personenwahl wert={ids} setzen={setIds} />
      </div>
    </Dialog>
  );
}

const SCHNELL_STUNDEN = [1, 2, 4, 6, 8];

function minutenAus(h, m) {
  const hh = Number(String(h || 0).replace(",", "."));
  const mm = Number(m || 0);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
  return Math.round(hh * 60 + mm);
}

// Stunden nachtragen oder einen Eintrag bearbeiten
export function ZeitDialog({ auftrag, eintrag, onClose, onFertig }) {
  const { nutzer, istAdmin, melde } = useDaten();
  const neu = !eintrag;
  const laeuftNoch = eintrag && eintrag.quelle === "timer" && !eintrag.ende;
  const [ids, setIds] = useState([nutzer.id]);
  const [datum, setDatum] = useState(eintrag?.datum || heuteISO());
  const [h, setH] = useState(eintrag ? String(Math.floor(eintrag.minuten / 60)) : "");
  const [m, setM] = useState(eintrag ? String(eintrag.minuten % 60) : "0");
  const [notiz, setNotiz] = useState(eintrag?.notiz || "");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [loeschen, setLoeschen] = useState(false);

  const min = minutenAus(h, m);
  const gueltig = laeuftNoch || (Number.isFinite(min) && min >= 1 && min <= 1440 && datum && (!neu || ids.length > 0));

  async function speichern() {
    setLaeuft(true);
    setFehler(null);
    try {
      if (neu) {
        await api.zeitEintragen({ auftrag_id: auftrag.id, staff_ids: istAdmin ? ids : undefined, datum, minuten: min, notiz });
        melde(ids.length > 1 ? `${dauer(min)} für ${ids.length} Personen eingetragen` : `${dauer(min)} eingetragen`);
      } else {
        await api.zeitPatch(eintrag.id, laeuftNoch ? { notiz } : { datum, minuten: min, notiz });
        melde("Eintrag gespeichert");
      }
      await onFertig();
    } catch (e) { setFehler(e.message); setLaeuft(false); }
  }

  return (
    <>
      <Dialog offen={!loeschen} titel={neu ? "Stunden eintragen" : `Eintrag von ${eintrag.wer}`} onClose={onClose}
        fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
          <button className="knopf primaer" disabled={!gueltig || laeuft} onClick={speichern}>{laeuft ? "Wird gespeichert …" : neu ? "Eintragen" : "Speichern"}</button></>}>
        <div className="stapel">
          {neu && <Personenwahl wert={ids} setzen={setIds} />}
          {laeuftNoch ? (
            <Hinweis icon="uhr">Dieser Timer läuft noch. Die Dauer kannst du nach dem Stoppen anpassen.</Hinweis>
          ) : (
            <>
              <Feld label="Datum"><input className="eingabe" type="date" value={datum} max={heuteISO()} onChange={(e) => setDatum(e.target.value)} /></Feld>
              <div className="feld">
                <span className="feld-label">Dauer</span>
                <div className="feldreihe immer-2">
                  <span className="eingabe-gruppe">
                    <input className="eingabe" style={{ paddingLeft: 13 }} inputMode="decimal" value={h} placeholder="0" autoFocus={neu}
                      onChange={(e) => setH(e.target.value.replace(/[^\d,.]/g, "").slice(0, 5))} aria-label="Stunden" />
                    <span className="eingabe-suffix">Std</span>
                  </span>
                  <span className="eingabe-gruppe">
                    <select className="eingabe" style={{ paddingLeft: 13 }} value={m} onChange={(e) => setM(e.target.value)} aria-label="Minuten">
                      {[0, 15, 30, 45].concat(eintrag && ![0, 15, 30, 45].includes(eintrag.minuten % 60) ? [eintrag.minuten % 60] : []).sort((a, b) => a - b)
                        .map((x) => <option key={x} value={String(x)}>{x} min</option>)}
                    </select>
                  </span>
                </div>
                <div className="schnellwahl" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                  {SCHNELL_STUNDEN.map((s) => <button key={s} type="button" onClick={() => { setH(String(s)); setM("0"); }}>{s} h</button>)}
                </div>
              </div>
            </>
          )}
          <Feld label="Was wurde gemacht?" hilfe="optional, z. B. Pflaster verlegt, Hecke geschnitten">
            <input className="eingabe" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
          </Feld>
          {!neu && eintrag.quelle === "timer" && eintrag.start && (
            <p className="feld-hilfe">Per Timer erfasst: {uhrzeit(eintrag.start)}{eintrag.ende ? ` bis ${uhrzeit(eintrag.ende)}` : ""} Uhr</p>
          )}
          {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
          {!neu && <button type="button" className="knopf gefahr-leise" style={{ alignSelf: "flex-start" }} onClick={() => setLoeschen(true)}><Icon name="loeschen" groesse={18} />Eintrag löschen</button>}
        </div>
      </Dialog>
      <Bestaetigen offen={loeschen} titel="Eintrag löschen?" laeuft={laeuft} knopf="Löschen"
        text={eintrag ? `${dauer(eintrag.minuten)} von ${eintrag.wer} werden gelöscht.` : ""}
        onNein={() => setLoeschen(false)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.zeitLoeschen(eintrag.id); melde("Eintrag gelöscht"); await onFertig(); }
          catch (e) { setFehler(e.message); setLaeuft(false); setLoeschen(false); }
        }} />
    </>
  );
}
