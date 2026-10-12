"use client";
import { useRef, useState } from "react";
import Icon from "./Icon";
import { useDaten } from "./DatenKontext";
import { Bestaetigen, Dialog, Hinweis } from "./ui";
import { initialen, zeigeZeit } from "@/lib/format";
import { kb, komprimieren, vorschau } from "@/lib/bild";
import { api } from "@/lib/api";

const MAX_BILDER = 4;

// Notizen & Belege eines Auftrags
export default function Notizen({ auftrag, notizen, onGeaendert }) {
  const { nutzer, istAdmin, melde } = useDaten();
  const [text, setText] = useState("");
  const [bilder, setBilder] = useState([]); // { gross, klein, b, h, vorher, nachher, vorschauUrl }
  const [verarbeite, setVerarbeite] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ansicht, setAnsicht] = useState(null); // { notiz, index }
  const [bearbeiten, setBearbeiten] = useState(null);
  const eingabe = useRef(null);

  const darf = (n) => istAdmin || n.staff_id === nutzer.id;

  async function dateienGewaehlt(e) {
    const dateien = [...(e.target.files || [])];
    e.target.value = "";
    if (!dateien.length) return;
    const platz = MAX_BILDER - bilder.length;
    if (dateien.length > platz) melde(`Maximal ${MAX_BILDER} Bilder pro Notiz`, "fehler");
    setFehler(null);
    for (const d of dateien.slice(0, Math.max(0, platz))) {
      setVerarbeite((x) => x + 1);
      try {
        const g = await komprimieren(d, { kante: 1600, guete: 0.72, maxBytes: 350 * 1024 });
        const k = vorschau(g.quelle, 240, 0.6);
        setBilder((l) => [...l, { gross: g.url, klein: k.url, b: g.b, h: g.h, vorher: d.size, nachher: g.bytes + k.bytes }]);
      } catch (err) {
        setFehler(`„${d.name}“ konnte nicht gelesen werden. Bitte ein Foto (JPG, PNG, HEIC) wählen.`);
      }
      setVerarbeite((x) => x - 1);
    }
  }

  async function speichern() {
    if ((!text.trim() && !bilder.length) || laeuft || verarbeite) return;
    setLaeuft(true);
    setFehler(null);
    try {
      await api.notizAnlegen(auftrag.id, text.trim(), bilder.map(({ gross, klein, b, h }) => ({ gross, klein, b, h })));
      setText("");
      setBilder([]);
      await onGeaendert();
      melde("Notiz gespeichert");
    } catch (err) { setFehler(err.message); }
    setLaeuft(false);
  }

  const gespart = bilder.reduce((s, b) => s + b.vorher, 0);
  const neu = bilder.reduce((s, b) => s + b.nachher, 0);

  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2 className="titel-s reihe" style={{ gap: 8 }}><Icon name="notiz" groesse={18} className="sehr-leise" />Notizen & Belege</h2>
        {notizen.length > 0 && <span className="sehr-leise klein">{notizen.length}</span>}
      </div>

      <div className="notiz-eingabe">
        <textarea className="eingabe" rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000}
          placeholder="Notiz schreiben, z. B. Absprache mit dem Kunden" />
        {(bilder.length > 0 || verarbeite > 0) && (
          <div className="bildleiste">
            {bilder.map((b, i) => (
              <div key={i} className="bild-mini">
                <img src={b.klein} alt="" />
                <button type="button" className="bild-weg" onClick={() => setBilder(bilder.filter((_, j) => j !== i))} aria-label="Bild entfernen"><Icon name="schliessen" groesse={14} staerke={2.4} /></button>
              </div>
            ))}
            {Array.from({ length: verarbeite }).map((_, i) => <div key={"v" + i} className="bild-mini skelett" />)}
          </div>
        )}
        {bilder.length > 0 && (
          <p className="feld-hilfe">{bilder.length} {bilder.length === 1 ? "Bild" : "Bilder"} komprimiert: {kb(gespart)} → {kb(neu)}</p>
        )}
        {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
        <div className="reihe zwischen">
          <label className={"knopf sekundaer" + (bilder.length >= MAX_BILDER ? " deaktiviert" : "")} aria-disabled={bilder.length >= MAX_BILDER}>
            <Icon name="kamera" groesse={18} />Foto / Beleg
            <input ref={eingabe} type="file" accept="image/*" multiple hidden onChange={dateienGewaehlt} disabled={bilder.length >= MAX_BILDER} />
          </label>
          <button className="knopf primaer" onClick={speichern} disabled={(!text.trim() && !bilder.length) || laeuft || verarbeite > 0}>
            {laeuft ? "Wird gespeichert …" : verarbeite ? "Bilder werden verkleinert …" : "Speichern"}
          </button>
        </div>
      </div>

      {notizen.length === 0 ? (
        <p className="leise klein" style={{ padding: "4px 20px 18px" }}>Hier landen Absprachen mit dem Kunden, Fotos vom Baufortschritt und Belege von Extra-Einkäufen.</p>
      ) : (
        <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
          {notizen.map((n) => (
            <div key={n.id} className="notiz">
              <span className="avatar hell" style={{ width: 34, height: 34, fontSize: 12 }}>{initialen(n.wer)}</span>
              <div className="notiz-inhalt">
                <div className="reihe zwischen" style={{ alignItems: "baseline" }}>
                  <span><span className="stark">{n.wer}</span><span className="sehr-leise klein"> {zeigeZeit(n.created_at)}</span></span>
                  {darf(n) && (
                    <button className="knopf geist rund klein" onClick={() => setBearbeiten(n)} aria-label="Notiz bearbeiten" title="Bearbeiten"><Icon name="bearbeiten" groesse={16} /></button>
                  )}
                </div>
                {n.text && <p className="notiz-text">{n.text}</p>}
                {n.bilder?.length > 0 && (
                  <div className="bildleiste">
                    {n.bilder.map((b, i) => (
                      <button key={b.gross} type="button" className="bild-mini gross" onClick={() => setAnsicht({ notiz: n, index: i })} aria-label={`Bild ${i + 1} ansehen`}>
                        {b.vorschau ? <img src={b.vorschau} alt="" loading="lazy" /> : <Icon name="kamera" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ansicht && <Bildansicht notiz={ansicht.notiz} start={ansicht.index} darf={darf(ansicht.notiz)} onClose={() => setAnsicht(null)}
        onEntfernt={async () => { setAnsicht(null); await onGeaendert(); }} />}
      {bearbeiten && <NotizBearbeiten notiz={bearbeiten} onClose={() => setBearbeiten(null)} onFertig={async () => { setBearbeiten(null); await onGeaendert(); }} />}
    </div>
  );
}

function Bildansicht({ notiz, start, darf, onClose, onEntfernt }) {
  const { melde } = useDaten();
  const [i, setI] = useState(start);
  const [fragen, setFragen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const bilder = notiz.bilder || [];
  const b = bilder[i];
  if (!b) return null;
  const nurBild = !notiz.text && bilder.length === 1;
  return (
    <>
      <Dialog offen={!fragen} titel={`Bild ${i + 1} von ${bilder.length}`} onClose={onClose}
        fuss={<>
          {bilder.length > 1 && <button className="knopf sekundaer rund" onClick={() => setI((i - 1 + bilder.length) % bilder.length)} aria-label="Vorheriges Bild"><Icon name="zurueck" /></button>}
          {b.url && <a className="knopf sekundaer" href={b.url} target="_blank" rel="noreferrer">In voller Größe öffnen</a>}
          {bilder.length > 1 && <button className="knopf sekundaer rund" onClick={() => setI((i + 1) % bilder.length)} aria-label="Nächstes Bild"><Icon name="weiter" /></button>}
        </>}>
        <div className="bild-gross">{b.url ? <img src={b.url} alt={`Bild ${i + 1}`} /> : <p className="leise">Bild nicht verfügbar.</p>}</div>
        <div className="reihe zwischen" style={{ marginTop: 10 }}>
          <span className="sehr-leise klein">{notiz.wer}, {zeigeZeit(notiz.created_at)}{b.bytes ? `, ${kb(b.bytes)}` : ""}</span>
          {darf && !nurBild && <button className="knopf gefahr-leise klein" onClick={() => setFragen(true)}><Icon name="loeschen" groesse={16} />Bild löschen</button>}
        </div>
      </Dialog>
      <Bestaetigen offen={fragen} titel="Bild löschen?" text="Das Bild wird endgültig aus der Notiz entfernt." knopf="Löschen" laeuft={laeuft}
        onNein={() => setFragen(false)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.notizPatch(notiz.id, { bildEntfernen: b.gross }); melde("Bild gelöscht"); await onEntfernt(); }
          catch (e) { melde(e.message, "fehler"); setLaeuft(false); setFragen(false); }
        }} />
    </>
  );
}

function NotizBearbeiten({ notiz, onClose, onFertig }) {
  const { melde } = useDaten();
  const [text, setText] = useState(notiz.text || "");
  const [loeschen, setLoeschen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const hatBilder = (notiz.bilder || []).length > 0;
  return (
    <>
      <Dialog offen={!loeschen} titel="Notiz bearbeiten" onClose={onClose}
        fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
          <button className="knopf primaer" disabled={laeuft || (!text.trim() && !hatBilder)} onClick={async () => {
            setLaeuft(true); setFehler(null);
            try { await api.notizPatch(notiz.id, { text }); melde("Notiz gespeichert"); await onFertig(); }
            catch (e) { setFehler(e.message); setLaeuft(false); }
          }}>Speichern</button></>}>
        <div className="stapel">
          <textarea className="eingabe" rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} autoFocus />
          {hatBilder && <p className="feld-hilfe">Einzelne Bilder löschst du, indem du das Bild antippst.</p>}
          {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
          <button className="knopf gefahr-leise" style={{ alignSelf: "flex-start" }} onClick={() => setLoeschen(true)}><Icon name="loeschen" groesse={18} />Notiz löschen</button>
        </div>
      </Dialog>
      <Bestaetigen offen={loeschen} titel="Notiz löschen?" laeuft={laeuft} knopf="Löschen"
        text={hatBilder ? "Die Notiz wird mit allen Bildern endgültig gelöscht." : "Die Notiz wird endgültig gelöscht."}
        onNein={() => setLoeschen(false)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.notizLoeschen(notiz.id); melde("Notiz gelöscht"); await onFertig(); }
          catch (e) { melde(e.message, "fehler"); setLaeuft(false); setLoeschen(false); }
        }} />
    </>
  );
}
