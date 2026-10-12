"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FotoKnopf from "@/components/Foto";
import { useDaten } from "@/components/DatenKontext";
import { Bestaetigen, Dialog, Feld, Kachel, Laden, Leer, Seitenkopf, Status } from "@/components/ui";
import Verlauf from "@/components/Verlauf";
import { LAGER, STATUS, fristText, heuteISO, pruefStatus, zeigeDatum } from "@/lib/format";
import { api } from "@/lib/api";

export default function GeraetSeite() {
  const { id } = useParams();
  const router = useRouter();
  const { vehicles, tools, laden, istAdmin, neuLaden, melde } = useDaten();
  const [dialog, setDialog] = useState(null); // umbuchen | melden | bearbeiten | loeschen
  const [laeuft, setLaeuft] = useState(false);

  if (laden) return <Laden />;
  const tool = tools.find((t) => t.id === id);
  if (!tool) {
    return (
      <div className="karte">
        <Leer icon="suche" titel="Gerät nicht gefunden" text="Es wurde vielleicht gelöscht.">
          <button className="knopf sekundaer" onClick={() => router.push("/dashboard/geraete")}>Zur Geräteliste</button>
        </Leer>
      </div>
    );
  }

  const orte = [LAGER, ...vehicles];
  const ortName = (oid) => (orte.find((o) => o.id === oid) || {}).name || "Unbekannt";
  const p = pruefStatus(tool);
  const status = tool.status || "ok";

  async function aktion(fn, erfolg) {
    setLaeuft(true);
    try {
      await fn();
      await neuLaden();
      melde(erfolg);
      setDialog(null);
    } catch (e) {
      melde(e.message, "fehler");
    }
    setLaeuft(false);
  }

  const umbuchen = (ziel) => aktion(
    () => api.toolPatch(tool.id, { ort_id: ziel, logtext: "Umgebucht nach " + ortName(ziel) }),
    "Umgebucht nach " + ortName(ziel),
  );
  const freigeben = () => aktion(
    () => api.toolPatch(tool.id, { status: "ok", notiz: "", logtext: "Als einsatzbereit freigegeben" }),
    "Als einsatzbereit freigegeben",
  );
  const pruefungEintragen = () => aktion(
    () => api.toolPatch(tool.id, { geprueft: heuteISO(), logtext: "Prüfung durchgeführt" }),
    "Prüfung eingetragen",
  );

  return (
    <div>
      <Seitenkopf zurueck={{ href: "/dashboard/geraete", text: "Geräte" }} titel={tool.name}
        sub={<span className="reihe umbruch" style={{ gap: 8 }}>
          <Status status={status} />
          {tool.inv_nr && <span className="marke-klein">{tool.inv_nr}</span>}
          {tool.kategorie && <span>{tool.kategorie}</span>}
        </span>}
        aktionen={istAdmin && <button className="knopf sekundaer" onClick={() => setDialog("bearbeiten")}><Icon name="bearbeiten" groesse={18} />Bearbeiten</button>}
      />

      <div className="raster-haupt">
        <div className="stapel">
          {tool.hat_bild && tool.foto_url && <div className="titelbild" style={{ marginBottom: 0 }}><img src={tool.foto_url} alt={tool.name} /></div>}

          <div className="karte">
            <div className="karte-innen reihe" style={{ gap: 14 }}>
              <Kachel art={tool.ort_id === "lager" ? "halle" : "transporter"} />
              <div className="zeile-mitte">
                <span className="leise klein">Aktueller Standort</span>
                <span className="titel-m">{ortName(tool.ort_id)}</span>
              </div>
              <button className="knopf sekundaer nur-desktop" onClick={() => setDialog("umbuchen")}><Icon name="tauschen" groesse={18} />Umbuchen</button>
            </div>
            {tool.notiz && status !== "ok" && <div className="notiz-anzeige">{tool.notiz}</div>}
            <dl className="datenliste" style={{ margin: 0 }}>
              <div><dt>Zustand</dt><dd>{(STATUS[status] || STATUS.ok).label}</dd></div>
              <div><dt>Inventarnummer</dt><dd>{tool.inv_nr || "–"}</dd></div>
              <div><dt>Kategorie</dt><dd>{tool.kategorie || "–"}</dd></div>
              <div><dt>Seriennummer</dt><dd>{tool.serien_nr || "–"}</dd></div>
              <div><dt>Letzte Prüfung</dt><dd>{zeigeDatum(tool.geprueft)}</dd></div>
              <div>
                <dt>Nächste Prüfung</dt>
                <dd className={p ? (p.tage < 0 ? "ueberfaellig" : p.tage <= 30 ? "bald" : "") : ""}>
                  {p ? `${zeigeDatum(p.datum)} (${fristText(p.tage)})` : tool.intervall_monate ? "–" : "Kein Intervall"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="aktionsreihe">
            <button className="knopf primaer gross nur-mobil" onClick={() => setDialog("umbuchen")} style={{ flex: "1 1 100%" }}><Icon name="tauschen" groesse={18} />Umbuchen</button>
            {status === "ok" ? (
              <button className="knopf warn gross" onClick={() => setDialog("melden")}><Icon name="warnung" groesse={18} />Problem melden</button>
            ) : (
              <>
                <button className="knopf sekundaer gross" onClick={() => setDialog("melden")}><Icon name="bearbeiten" groesse={18} />Meldung ändern</button>
                {istAdmin && <button className="knopf akzent gross" onClick={freigeben} disabled={laeuft}><Icon name="haken" groesse={18} />Freigeben</button>}
              </>
            )}
          </div>

          <Verlauf log={tool.log} istAdmin={istAdmin} onLeeren={() => aktion(() => api.toolPatch(tool.id, { logtext: null }), "Verlauf geleert")} />
        </div>

        {istAdmin && (
          <div className="stapel">
            <div className="karte">
              <div className="karte-kopf"><h2 className="titel-s">Prüfung</h2></div>
              <div className="karte-innen" style={{ paddingTop: 0 }}>
                <p className="leise klein" style={{ marginBottom: 12 }}>
                  {tool.intervall_monate ? `Prüfintervall: alle ${tool.intervall_monate} Monate` : "Kein Prüfintervall hinterlegt. Unter „Bearbeiten“ festlegen, z. B. 12 Monate für UVV."}
                </p>
                <button className="knopf sekundaer breit" onClick={pruefungEintragen} disabled={laeuft}><Icon name="schild" groesse={18} />Heute geprüft</button>
              </div>
            </div>
            <div className="karte">
              <div className="karte-kopf"><h2 className="titel-s">Foto</h2></div>
              <div className="karte-innen" style={{ paddingTop: 0 }}>
                <FotoKnopf art="tool" id={tool.id} hatBild={!!tool.hat_bild} onFertig={neuLaden} melde={melde} />
              </div>
            </div>
            <button className="knopf gefahr-leise" onClick={() => setDialog("loeschen")} style={{ alignSelf: "flex-start" }}><Icon name="loeschen" groesse={18} />Gerät löschen</button>
          </div>
        )}
      </div>

      <Dialog offen={dialog === "umbuchen"} titel="Wohin kommt das Gerät?" onClose={() => setDialog(null)}>
        <div className="karte liste-zeilen">
          {orte.filter((o) => o.id !== tool.ort_id).map((o) => (
            <button key={o.id} className="zeile" onClick={() => umbuchen(o.id)} disabled={laeuft}>
              <Kachel thumb={o.thumb} art={o.id === "lager" ? "halle" : "transporter"} />
              <span className="zeile-mitte">
                <span className="zeile-titel">{o.name}</span>
                {o.kennzeichen && <span className="zeile-sub"><span className="kennzeichen">{o.kennzeichen}</span></span>}
              </span>
              <Icon name="weiter" className="chevron" />
            </button>
          ))}
        </div>
      </Dialog>

      {dialog === "melden" && <MeldenDialog offen tool={tool} laeuft={laeuft} onClose={() => setDialog(null)}
        onSpeichern={(st, text) => aktion(
          () => api.toolPatch(tool.id, { status: st, notiz: text, logtext: STATUS[st].label + (text ? ": " + text : "") }),
          "Meldung gespeichert",
        )} />}

      {istAdmin && dialog === "bearbeiten" && (
        <BearbeitenDialog offen tool={tool} laeuft={laeuft} onClose={() => setDialog(null)}
          onSpeichern={(patch) => aktion(() => api.toolPatch(tool.id, { ...patch, logtext: "Daten bearbeitet" }), "Änderungen gespeichert")} />
      )}

      <Bestaetigen offen={dialog === "loeschen"} titel="Gerät löschen?" laeuft={laeuft}
        text={`„${tool.name}“ wird mit Foto und Verlauf endgültig gelöscht.`} knopf="Endgültig löschen"
        onNein={() => setDialog(null)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.toolLoeschen(tool.id); await neuLaden(); melde("Gerät gelöscht"); router.push("/dashboard/geraete"); }
          catch (e) { melde(e.message, "fehler"); setLaeuft(false); }
        }} />
    </div>
  );
}

function MeldenDialog({ offen, tool, laeuft, onClose, onSpeichern }) {
  const [st, setSt] = useState(tool.status && tool.status !== "ok" ? tool.status : "defekt");
  const [text, setText] = useState(tool.notiz || "");
  return (
    <Dialog offen={offen} titel="Problem melden" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" onClick={() => onSpeichern(st, text.trim())} disabled={laeuft}>Meldung speichern</button></>}>
      <div className="stapel">
        <div className="feld">
          <span className="feld-label">Was ist los?</span>
          <div className="stapel-s">
            {["defekt", "wartung", "weg"].map((k) => (
              <button key={k} type="button" className={"auswahl" + (st === k ? " aktiv" : "")} onClick={() => setSt(k)} aria-pressed={st === k}>
                <span className={"auswahl-punkt " + k} />{STATUS[k].label}
                {st === k && <Icon name="haken" groesse={18} className="auswahl-haken" />}
              </button>
            ))}
          </div>
        </div>
        <Feld label="Beschreibung" hilfe="Hilft beim Reparieren, z. B. was genau passiert ist.">
          <textarea className="eingabe" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Springt nicht an, Seilzug gerissen" />
        </Feld>
      </div>
    </Dialog>
  );
}

function BearbeitenDialog({ offen, tool, laeuft, onClose, onSpeichern }) {
  const [f, setF] = useState({
    name: tool.name || "", kategorie: tool.kategorie || "", inv_nr: tool.inv_nr || "", serien_nr: tool.serien_nr || "",
    intervall_monate: tool.intervall_monate ? String(tool.intervall_monate) : "", geprueft: tool.geprueft || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function speichern() {
    onSpeichern({
      name: f.name.trim(), kategorie: f.kategorie.trim(), inv_nr: f.inv_nr.trim(), serien_nr: f.serien_nr.trim(),
      intervall_monate: f.intervall_monate ? Number(f.intervall_monate) : null, geprueft: f.geprueft || null,
    });
  }
  return (
    <Dialog offen={offen} titel="Gerät bearbeiten" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" onClick={speichern} disabled={!f.name.trim() || laeuft}>Speichern</button></>}>
      <div>
        <Feld label="Bezeichnung"><input className="eingabe" value={f.name} onChange={set("name")} /></Feld>
        <div className="feldreihe">
          <Feld label="Kategorie"><input className="eingabe" value={f.kategorie} onChange={set("kategorie")} /></Feld>
          <Feld label="Inventarnummer"><input className="eingabe" value={f.inv_nr} onChange={set("inv_nr")} /></Feld>
        </div>
        <Feld label="Seriennummer"><input className="eingabe" value={f.serien_nr} onChange={set("serien_nr")} /></Feld>
        <div className="feldreihe">
          <Feld label="Prüfintervall (Monate)">
            <input className="eingabe" inputMode="numeric" value={f.intervall_monate} onChange={(e) => setF({ ...f, intervall_monate: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="z. B. 12" />
          </Feld>
          <Feld label="Letzte Prüfung"><input className="eingabe" type="date" value={f.geprueft} onChange={set("geprueft")} /></Feld>
        </div>
      </div>
    </Dialog>
  );
}
