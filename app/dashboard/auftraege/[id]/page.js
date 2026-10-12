"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import BuchenDialog from "@/components/BuchenDialog";
import Notizen from "@/components/Notizen";
import AuftragFormular, { leererAuftrag } from "@/components/AuftragFormular";
import { Laufzeit, TeamStartDialog, ZeitDialog, useLaufzeit } from "@/components/Zeiterfassung";
import { useDaten } from "@/components/DatenKontext";
import { Bestaetigen, Dialog, Hinweis, Kachel, Laden, Leer, Seitenkopf, Segment, Suche } from "@/components/ui";
import {
  AUFTRAG_STATUS, adresseLink, artFuerMaterial, dauer, euro, initialen, passtSuche, tagText, telLink, uhrzeit, zahlText,
} from "@/lib/format";
import { api } from "@/lib/api";

export default function AuftragSeite() {
  const { id } = useParams();
  const router = useRouter();
  const { auftraege, laufend, materials, laden, nutzer, istAdmin, neuLaden, melde } = useDaten();
  const [details, setDetails] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  const ladeDetails = useCallback(async () => {
    try { setDetails(await api.auftragDetails(id)); } catch (e) { setDetails({ zeiten: [], material: [], notizen: [] }); }
  }, [id]);
  const laufSchluessel = laufend.filter((z) => z.auftrag_id === id).map((z) => z.id).join(",");
  useEffect(() => { ladeDetails(); }, [ladeDetails, laufSchluessel]);

  const auftrag = auftraege.find((a) => a.id === id);
  const hierLaufend = laufend.filter((z) => z.auftrag_id === id);
  const meiner = hierLaufend.find((z) => z.staff_id === nutzer.id);
  const andere = hierLaufend.filter((z) => z.staff_id !== nutzer.id);

  const zeiten = details?.zeiten || [];
  const fertigeZeiten = zeiten.filter((z) => !(z.quelle === "timer" && !z.ende));

  const jePerson = useMemo(() => {
    const m = new Map();
    fertigeZeiten.forEach((z) => {
      const k = z.staff_id || z.wer;
      const e = m.get(k) || { wer: z.wer, minuten: 0, tage: new Set() };
      e.minuten += z.minuten; e.tage.add(z.datum);
      m.set(k, e);
    });
    return [...m.values()].sort((a, b) => b.minuten - a.minuten);
  }, [fertigeZeiten]);

  const materialSummen = useMemo(() => {
    const m = new Map();
    (details?.material || []).forEach((b) => {
      if (!b.material) return;
      const e = m.get(b.material.id) || { material: b.material, menge: 0 };
      e.menge += -Number(b.menge);
      m.set(b.material.id, e);
    });
    return [...m.values()].filter((e) => Math.abs(e.menge) > 0.001).sort((a, b) => a.material.name.localeCompare(b.material.name, "de"));
  }, [details]);

  if (laden) return <Laden />;
  if (!auftrag) {
    return (
      <div className="karte">
        <Leer icon="suche" titel="Auftrag nicht gefunden" text="Er wurde vielleicht gelöscht.">
          <button className="knopf sekundaer" onClick={() => router.push("/dashboard/auftraege")}>Zu den Aufträgen</button>
        </Leer>
      </div>
    );
  }

  const st = AUFTRAG_STATUS[auftrag.status] || AUFTRAG_STATUS.geplant;
  const abgeschlossen = auftrag.status === "abgeschlossen";
  const gesamtMinuten = fertigeZeiten.reduce((s, z) => s + z.minuten, 0);
  const materialwert = materialSummen.reduce((s, e) => s + e.menge * Number(e.material.preis || 0), 0);
  const darf = (z) => istAdmin || z.staff_id === nutzer.id;

  async function aktualisieren() {
    await Promise.all([neuLaden(), ladeDetails()]);
  }

  async function starten(ids, wechseln = false) {
    setLaeuft(true);
    try {
      await api.timerStarten(auftrag.id, ids, wechseln);
      await aktualisieren();
      melde(ids && ids.length > 1 ? `Timer für ${ids.length} Personen gestartet` : "Timer gestartet");
      setDialog(null);
    } catch (e) {
      if (e.status === 409 && e.daten?.konflikt) setDialog({ konflikt: e.daten.konflikt, ids });
      else melde(e.message, "fehler");
    }
    setLaeuft(false);
  }

  async function stoppen(eintraege) {
    setLaeuft(true);
    try {
      let summe = 0;
      for (const z of eintraege) { const r = await api.timerStoppen(z.id); summe += r.minuten || 0; }
      await aktualisieren();
      melde(eintraege.length > 1 ? `Timer für ${eintraege.length} Personen gestoppt` : `${dauer(summe)} erfasst`);
    } catch (e) { melde(e.message, "fehler"); }
    setLaeuft(false);
  }

  async function statusSetzen(status) {
    try {
      await api.auftragPatch(auftrag.id, { status });
      await aktualisieren();
      melde(status === "abgeschlossen" ? "Auftrag abgeschlossen" : `Status: ${AUFTRAG_STATUS[status].label}`);
    } catch (e) { melde(e.message, "fehler"); }
  }

  // Zeiten nach Tag gruppieren
  let letzterTag = null;

  return (
    <div>
      <Seitenkopf zurueck={{ href: "/dashboard/auftraege", text: "Aufträge" }} titel={auftrag.titel}
        sub={<span className="reihe umbruch" style={{ gap: 8 }}>
          <span className={"status " + st.klasse}>{st.label}</span>
          <span className="marke-klein">Nr. {auftrag.nummer}</span>
          {auftrag.kunde && <span>{auftrag.kunde}</span>}
        </span>}
        aktionen={istAdmin && <button className="knopf sekundaer" onClick={() => setDialog("bearbeiten")}><Icon name="bearbeiten" groesse={18} />Bearbeiten</button>} />

      <div className={istAdmin ? "raster-haupt" : ""} style={istAdmin ? undefined : { maxWidth: 760 }}>
        <div className="stapel">
          {(auftrag.adresse || auftrag.telefon || auftrag.notiz) && (
            <div className="karte kundenkarte">
              {auftrag.adresse && (
                <div className="reihe" style={{ alignItems: "flex-start", gap: 12 }}>
                  <Icon name="ort" groesse={20} className="sehr-leise" />
                  <div className="adresse">{auftrag.adresse}</div>
                </div>
              )}
              {auftrag.notiz && <Hinweis>{auftrag.notiz}</Hinweis>}
              {(auftrag.adresse || auftrag.telefon) && (
                <div className="kundenkarte-aktionen">
                  {auftrag.adresse && <a className="knopf sekundaer klein" href={adresseLink(auftrag.adresse)} target="_blank" rel="noreferrer"><Icon name="route" groesse={16} />Route</a>}
                  {auftrag.telefon && <a className="knopf sekundaer klein" href={telLink(auftrag.telefon)}><Icon name="telefon" groesse={16} />{auftrag.telefon}</a>}
                </div>
              )}
            </div>
          )}

          <Stempelkarte auftrag={auftrag} meiner={meiner} andere={andere} laeuft={laeuft} istAdmin={istAdmin} nutzer={nutzer}
            abgeschlossen={abgeschlossen}
            onStart={() => starten(undefined)} onStopp={stoppen}
            onTeam={() => setDialog("team")} onManuell={() => setDialog("manuell")} />

          <div className="karte">
            <div className="summen">
              <div><strong>{dauer(gesamtMinuten)}</strong><span>Stunden gesamt</span></div>
              <div><strong>{jePerson.length}</strong><span>{jePerson.length === 1 ? "Person" : "Personen"}</span></div>
              <div><strong>{euro(materialwert)}</strong><span>Materialwert</span></div>
            </div>
          </div>

          {jePerson.length > 0 && (
            <div className="karte">
              <div className="karte-kopf"><h2 className="titel-s">Stunden je Mitarbeiter</h2></div>
              <div style={{ paddingBottom: 8 }}>
                {jePerson.map((p) => (
                  <div key={p.wer} className="balken-zeile">
                    <div className="reihe zwischen">
                      <span className="reihe" style={{ gap: 10 }}><span className="avatar hell" style={{ width: 28, height: 28, fontSize: 11 }}>{initialen(p.wer)}</span><span className="stark">{p.wer}</span></span>
                      <span><span className="stark">{dauer(p.minuten)}</span><span className="sehr-leise klein"> an {p.tage.size} {p.tage.size === 1 ? "Tag" : "Tagen"}</span></span>
                    </div>
                    <div className="fuellstand-balken"><span style={{ width: `${(p.minuten / jePerson[0].minuten) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="karte">
            <div className="karte-kopf">
              <h2 className="titel-s reihe" style={{ gap: 8 }}><Icon name="uhr" groesse={18} className="sehr-leise" />Arbeitszeiten</h2>
              <button className="knopf sekundaer klein" onClick={() => setDialog("manuell")}><Icon name="plus" groesse={16} />Eintragen</button>
            </div>
            {details === null ? <Laden /> : !zeiten.length ? (
              <p className="leise klein" style={{ padding: "0 20px 18px" }}>Noch keine Zeiten. Starte den Timer, sobald ihr auf der Baustelle seid, oder trage Stunden nachträglich ein.</p>
            ) : (
              <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
                {zeiten.map((z) => {
                  const neu = z.datum !== letzterTag;
                  letzterTag = z.datum;
                  const tagSumme = zeiten.filter((x) => x.datum === z.datum).reduce((s, x) => s + x.minuten, 0);
                  const laeuftNoch = z.quelle === "timer" && !z.ende;
                  return (
                    <Fragment key={z.id}>
                      {neu && <div className="gruppen-titel reihe zwischen"><span>{tagText(z.datum)}</span><span>{dauer(tagSumme)}</span></div>}
                      <button className="zeile" onClick={() => darf(z) && setDialog({ eintrag: z })} disabled={!darf(z)} style={{ cursor: darf(z) ? "pointer" : "default", minHeight: 58 }}>
                        <span className="avatar hell" style={{ width: 34, height: 34, fontSize: 12 }}>{initialen(z.wer)}</span>
                        <span className="zeile-mitte">
                          <span className="zeile-titel">{z.wer}</span>
                          <span className="zeile-sub">
                            {z.quelle === "timer" && z.start
                              ? <span><Icon name="uhr" groesse={14} />{uhrzeit(z.start)}{z.ende ? `–${uhrzeit(z.ende)}` : ""} Uhr</span>
                              : <span><Icon name="stift" groesse={14} />nachgetragen</span>}
                            {z.notiz && <span>{z.notiz}</span>}
                          </span>
                        </span>
                        <span className="zeile-rechts">
                          {laeuftNoch
                            ? <span className="reihe" style={{ gap: 8, color: "var(--gruen-tief)", fontWeight: 650 }}><span className="live-punkt" />läuft</span>
                            : <span className="stark" style={{ whiteSpace: "nowrap" }}>{dauer(z.minuten)}</span>}
                        </span>
                      </button>
                    </Fragment>
                  );
                })}
              </div>
            )}
          </div>

          <div className="karte">
            <div className="karte-kopf">
              <h2 className="titel-s reihe" style={{ gap: 8 }}><Icon name="lager" groesse={18} className="sehr-leise" />Material verbraucht</h2>
              {!abgeschlossen && <button className="knopf sekundaer klein" onClick={() => setDialog("material")}><Icon name="plus" groesse={16} />Erfassen</button>}
            </div>
            {details === null ? <Laden /> : !materialSummen.length ? (
              <p className="leise klein" style={{ padding: "0 20px 18px" }}>Noch kein Material gebucht. Was ihr hier erfasst, wird automatisch vom Lagerbestand abgezogen.</p>
            ) : (
              <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
                {materialSummen.map((e) => {
                  const lagerArtikel = materials.find((m) => m.id === e.material.id);
                  return (
                    <div key={e.material.id} className="zeile">
                      <Kachel thumb={lagerArtikel?.thumb} art={artFuerMaterial(e.material)} />
                      <span className="zeile-mitte">
                        <span className="zeile-titel">{e.material.name}</span>
                        {e.material.preis && <span className="zeile-sub"><span>{euro(e.menge * Number(e.material.preis))}</span></span>}
                      </span>
                      <span className="zeile-rechts">
                        <span className="bestand-zahl" style={{ fontSize: 18 }}>{zahlText(e.menge)}<span className="bestand-einheit">{e.material.einheit}</span></span>
                        {lagerArtikel && e.menge > 0 && (
                          <button className="knopf geist klein" onClick={() => setDialog({ rueckgabe: lagerArtikel, max: e.menge })} title="Übriges Material zurück ins Lager">Zurück</button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {details !== null && <Notizen auftrag={auftrag} notizen={details.notizen || []} onGeaendert={ladeDetails} />}
        </div>

        {istAdmin && (
          <div className="stapel">
            <div className="karte">
              <div className="karte-kopf"><h2 className="titel-s">Status</h2></div>
              <div className="karte-innen" style={{ paddingTop: 0 }}>
                <Segment breit optionen={[["geplant", "Geplant"], ["aktiv", "In Arbeit"], ["abgeschlossen", "Fertig"]]} wert={auftrag.status}
                  setzen={(s) => (s === "abgeschlossen" && hierLaufend.length ? setDialog("abschliessen") : s !== auftrag.status && statusSetzen(s))} />
                <p className="feld-hilfe" style={{ marginTop: 10 }}>
                  {abgeschlossen ? "Abgeschlossene Aufträge bleiben zum Nachschauen erhalten." : "Beim ersten Timer-Start springt ein geplanter Auftrag automatisch auf „In Arbeit“."}
                </p>
              </div>
            </div>
            <button className="knopf gefahr-leise" onClick={() => setDialog("loeschen")} style={{ alignSelf: "flex-start" }}><Icon name="loeschen" groesse={18} />Auftrag löschen</button>
          </div>
        )}
      </div>

      {dialog === "team" && <TeamStartDialog auftrag={auftrag} onClose={() => setDialog(null)} onStart={(ids) => starten(ids)} />}
      {dialog === "manuell" && <ZeitDialog auftrag={auftrag} onClose={() => setDialog(null)} onFertig={async () => { await aktualisieren(); setDialog(null); }} />}
      {dialog?.eintrag && <ZeitDialog auftrag={auftrag} eintrag={dialog.eintrag} onClose={() => setDialog(null)} onFertig={async () => { await aktualisieren(); setDialog(null); }} />}
      {dialog === "material" && (
        <MaterialWahl materials={materials} onClose={() => setDialog(null)} onWahl={(m) => setDialog({ verbrauch: m })} />
      )}
      {dialog?.verbrauch && (
        <BuchenDialog material={dialog.verbrauch} festAuftrag={auftrag} istAdmin={istAdmin} onClose={() => setDialog(null)}
          onBuchen={async (art, menge, notiz) => {
            await api.materialBuchen(dialog.verbrauch.id, "abgang", menge, notiz, auftrag.id);
            await aktualisieren();
            melde(`${zahlText(menge)} ${dialog.verbrauch.einheit} ${dialog.verbrauch.name} gebucht`);
            setDialog(null);
          }} />
      )}
      {dialog?.rueckgabe && (
        <BuchenDialog material={dialog.rueckgabe} festAuftrag={auftrag} rueckgabe maxMenge={dialog.max} istAdmin={istAdmin} onClose={() => setDialog(null)}
          onBuchen={async (art, menge, notiz) => {
            await api.materialBuchen(dialog.rueckgabe.id, "zugang", menge, notiz || "Rückgabe von Baustelle", auftrag.id);
            await aktualisieren();
            melde("Zurück ins Lager gebucht");
            setDialog(null);
          }} />
      )}
      {dialog?.konflikt && (
        <Bestaetigen offen titel="Timer wechseln?" gefahr={false} knopf="Wechseln und starten" laeuft={laeuft}
          text={`${dialog.konflikt.map((k) => `${k.wer} ist gerade bei „${k.auftrag}“ eingestempelt`).join(". ")}. Dort stoppen und hier starten?`}
          onNein={() => setDialog(null)} onJa={() => starten(dialog.ids, true)} />
      )}
      {dialog === "abschliessen" && (
        <Bestaetigen offen titel="Auftrag abschließen?" gefahr={false} knopf="Abschließen"
          text={`Auf diesem Auftrag laufen noch ${hierLaufend.length} Timer. Sie werden beim Abschließen gestoppt und die Zeit wird gespeichert.`}
          onNein={() => setDialog(null)} onJa={async () => { setDialog(null); await statusSetzen("abgeschlossen"); }} />
      )}
      {dialog === "bearbeiten" && (
        <Bearbeiten auftrag={auftrag} auftraege={auftraege} onClose={() => setDialog(null)}
          onSpeichern={async (f) => { await api.auftragPatch(auftrag.id, f); await aktualisieren(); melde("Änderungen gespeichert"); setDialog(null); }} />
      )}
      <Bestaetigen offen={dialog === "loeschen"} titel="Auftrag löschen?" knopf="Endgültig löschen" laeuft={laeuft}
        text={`„${auftrag.titel}“ wird mit allen Arbeitszeiten gelöscht. Gebuchtes Material bleibt vom Lager abgezogen.`}
        onNein={() => setDialog(null)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.auftragLoeschen(auftrag.id); await neuLaden(); melde("Auftrag gelöscht"); router.push("/dashboard/auftraege"); }
          catch (e) { melde(e.message, "fehler"); setLaeuft(false); }
        }} />
    </div>
  );
}

function Stempelkarte({ auftrag, meiner, andere, laeuft, istAdmin, nutzer, abgeschlossen, onStart, onStopp, onTeam, onManuell }) {
  const sek = useLaufzeit(meiner?.start);

  if (meiner) {
    return (
      <div className="karte" style={{ overflow: "hidden", borderColor: "var(--moos)" }}>
        <div className="stempel laeuft">
          <div className="stempel-kopf">
            <span className="reihe" style={{ gap: 10 }}><span className="live-punkt" /><span className="stark">Du bist eingestempelt</span></span>
            <span className="leise klein">seit {uhrzeit(meiner.start)} Uhr</span>
          </div>
          <div className="stempel-uhr" aria-live="off">{`${String(Math.floor(sek / 3600)).padStart(2, "0")}:${String(Math.floor((sek % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(sek % 60)).padStart(2, "0")}`}</div>
          <button className="knopf gross breit stopp-knopf" onClick={() => onStopp([meiner])} disabled={laeuft}><Icon name="stopp" groesse={18} />Stoppen</button>
          {istAdmin && andere.length > 0 && (
            <button className="knopf geist" onClick={() => onStopp([meiner, ...andere])} disabled={laeuft}>Alle {andere.length + 1} stoppen</button>
          )}
        </div>
        <TeamLaufend liste={andere} laeuft={laeuft} onStopp={istAdmin ? onStopp : null} />
      </div>
    );
  }

  return (
    <div className="karte" style={{ overflow: "hidden" }}>
      <div className="stempel">
        <div className="stempel-kopf">
          <span className="titel-s">Zeiterfassung</span>
          {andere.length > 0 && <span className="reihe klein" style={{ gap: 8, color: "var(--gruen-tief)", fontWeight: 600 }}><span className="live-punkt" />{andere.length} vor Ort</span>}
        </div>
        {abgeschlossen ? (
          <Hinweis>Dieser Auftrag ist abgeschlossen. Stunden lassen sich trotzdem noch nachtragen.</Hinweis>
        ) : (
          <button className="knopf akzent gross breit" onClick={onStart} disabled={laeuft}><Icon name="play" groesse={18} />Start: Ich bin auf der Baustelle</button>
        )}
        <div className="reihe umbruch" style={{ gap: 8 }}>
          {istAdmin && !abgeschlossen && <button className="knopf sekundaer" style={{ flex: "1 1 160px" }} onClick={onTeam}><Icon name="team" groesse={18} />Für Team starten</button>}
          <button className="knopf sekundaer" style={{ flex: "1 1 160px" }} onClick={onManuell}><Icon name="stift" groesse={18} />Stunden nachtragen</button>
        </div>
      </div>
      <TeamLaufend liste={andere} laeuft={laeuft} onStopp={istAdmin ? onStopp : null} />
    </div>
  );
}

function TeamLaufend({ liste, laeuft, onStopp }) {
  if (!liste.length) return null;
  return (
    <div className="team-laufend">
      {liste.map((z) => (
        <div key={z.id} className="team-zeile">
          <span className="avatar hell" style={{ width: 30, height: 30, fontSize: 11 }}>{initialen(z.wer)}</span>
          <span className="zeile-mitte"><span className="stark">{z.wer}</span><span className="sehr-leise klein">seit {uhrzeit(z.start)} Uhr</span></span>
          <Laufzeit start={z.start} className="einsatz-uhr" />
          {onStopp && <button className="knopf sekundaer klein" onClick={() => onStopp([z])} disabled={laeuft} aria-label={`Timer von ${z.wer} stoppen`}><Icon name="stopp" groesse={14} />Stopp</button>}
        </div>
      ))}
    </div>
  );
}

function MaterialWahl({ materials, onClose, onWahl }) {
  const [suche, setSuche] = useState("");
  const liste = materials.filter((m) => passtSuche(`${m.name} ${m.kategorie}`, suche));
  return (
    <Dialog offen titel="Welches Material?" onClose={onClose}>
      <div className="stapel">
        <Suche wert={suche} setzen={setSuche} platzhalter="Material suchen …" />
        {!materials.length ? (
          <p className="leise">Im Lager ist noch kein Material angelegt. Ein Admin kann das unter „Lager“ tun.</p>
        ) : (
          <div className="karte liste-zeilen" style={{ maxHeight: "50dvh", overflowY: "auto" }}>
            {liste.map((m) => {
              const leer = Number(m.bestand) <= 0;
              return (
                <button key={m.id} className="zeile" onClick={() => !leer && onWahl(m)} disabled={leer} style={{ opacity: leer ? 0.5 : 1, minHeight: 56 }}>
                  <Kachel thumb={m.thumb} art={artFuerMaterial(m)} groesse="klein" />
                  <span className="zeile-mitte"><span className="zeile-titel">{m.name}</span><span className="zeile-sub"><span>{m.kategorie || "Ohne Kategorie"}</span></span></span>
                  <span className="zeile-rechts"><span className={"klein " + (leer ? "ueberfaellig" : "leise")}>{leer ? "leer" : `${zahlText(m.bestand)} ${m.einheit}`}</span></span>
                </button>
              );
            })}
            {!liste.length && <p className="leise klein" style={{ padding: 16 }}>Nichts gefunden.</p>}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Bearbeiten({ auftrag, auftraege, onClose, onSpeichern }) {
  const [f, setF] = useState(leererAuftrag(auftrag));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  async function speichern() {
    setLaeuft(true);
    setFehler(null);
    const { status, ...rest } = f;
    try { await onSpeichern(rest); } catch (e) { setFehler(e.message); setLaeuft(false); }
  }
  return (
    <Dialog offen titel="Auftrag bearbeiten" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" disabled={!f.titel.trim() || laeuft} onClick={speichern}>Speichern</button></>}>
      <AuftragFormular f={f} setF={setF} auftraege={auftraege.filter((a) => a.id !== auftrag.id)} />
      {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
    </Dialog>
  );
}
