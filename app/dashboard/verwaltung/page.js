"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { Bestaetigen, Dialog, Feld, Hinweis, Kachel, Laden, Leer, Seitenkopf, Segment, Status } from "@/components/ui";
import { initialen } from "@/lib/format";
import { api } from "@/lib/api";

const nurZiffern = (v) => v.replace(/\D/g, "").slice(0, 8);
const sauberName = (v) => v.trim().replace(/\s+/g, "").toLowerCase();
function zufallsCode() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(100000 + (a[0] % 900000));
}

export default function Verwaltung() {
  const { istAdmin } = useDaten();
  const [tab, setTab] = useState("team");
  if (!istAdmin) return <div className="karte"><Leer icon="schloss" titel="Nur für Admins" text="Die Verwaltung ist Admins vorbehalten." /></div>;
  return (
    <div>
      <Seitenkopf titel="Verwaltung" sub="Zugänge für dein Team und die Fahrzeuge des Betriebs." />
      <div style={{ marginBottom: 16 }}>
        <Segment optionen={[["team", "Team"], ["fahrzeuge", "Fahrzeuge"]]} wert={tab} setzen={setTab} />
      </div>
      {tab === "team" ? <Team /> : <Fahrzeuge />}
    </div>
  );
}

function Team() {
  const { nutzer, melde } = useDaten();
  const [liste, setListe] = useState(null);
  const [dialog, setDialog] = useState(null); // "neu" | {person}
  const [neuerZugang, setNeuerZugang] = useState(null);

  const laden = useCallback(async () => {
    try { setListe(await api.nutzerListe()); } catch (e) { melde(e.message, "fehler"); setListe([]); }
  }, [melde]);
  useEffect(() => { laden(); }, [laden]);

  if (liste === null) return <Laden />;

  return (
    <>
      <div className="karte">
        <div className="karte-kopf">
          <h2 className="titel-s">{liste.length} {liste.length === 1 ? "Zugang" : "Zugänge"}</h2>
          <button className="knopf primaer klein" onClick={() => setDialog("neu")}><Icon name="plus" groesse={16} />Zugang anlegen</button>
        </div>
        <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
          {liste.map((u) => (
            <button key={u.id} className="zeile" onClick={() => setDialog({ person: u })}>
              <span className="avatar hell">{initialen(u.name)}</span>
              <span className="zeile-mitte">
                <span className="zeile-titel">{u.name}{u.id === nutzer.id && <span className="sehr-leise" style={{ fontWeight: 500 }}> (du)</span>}</span>
                <span className="zeile-sub"><span>@{u.username}</span></span>
              </span>
              <span className="zeile-rechts">
                <span className={"status ohne-punkt " + (u.rolle === "admin" ? "ok" : "weg")}>{u.rolle === "admin" ? "Admin" : "Mitarbeiter"}</span>
                <Icon name="weiter" groesse={18} className="chevron" />
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="feld-hilfe" style={{ marginTop: 12 }}>
        Mitarbeiter können ihre Arbeitszeit auf Aufträgen erfassen, Geräte umbuchen, Probleme melden und Material buchen. Admins dürfen zusätzlich anlegen, bearbeiten, löschen und Zeiten für andere erfassen.
      </p>

      {dialog === "neu" && (
        <NeuDialog liste={liste} onClose={() => setDialog(null)}
          onFertig={async (zugang) => { await laden(); setDialog(null); setNeuerZugang(zugang); melde("Zugang angelegt"); }} />
      )}
      {dialog && dialog.person && (
        <PersonDialog person={dialog.person} istIch={dialog.person.id === nutzer.id} onClose={() => setDialog(null)}
          onFertig={async (text) => { await laden(); setDialog(null); melde(text); }} />
      )}
      {neuerZugang && (
        <Dialog offen titel="Zugangsdaten weitergeben" onClose={() => setNeuerZugang(null)}
          fuss={<button className="knopf primaer" onClick={() => setNeuerZugang(null)}>Fertig</button>}>
          <ZugangsKarte {...neuerZugang} />
        </Dialog>
      )}
    </>
  );
}

function ZugangsKarte({ name, username, code }) {
  const { melde } = useDaten();
  const text = `Hallo ${name.split(" ")[0]}, dein Zugang zur Grünschmiede-App:\nBenutzername: ${username}\nCode: ${code}\n${typeof window !== "undefined" ? window.location.origin : ""}`;
  return (
    <div className="stapel">
      <p className="leise">Gib diese Daten an {name.split(" ")[0]} weiter. Der Code wird verschlüsselt gespeichert und ist danach nirgends mehr sichtbar.</p>
      <div className="karte">
        <dl className="datenliste" style={{ margin: 0 }}>
          <div style={{ borderTop: 0 }}><dt>Benutzername</dt><dd>{username}</dd></div>
          <div style={{ borderTop: 0 }}><dt>Code</dt><dd style={{ letterSpacing: "0.12em", fontSize: 18 }}>{code}</dd></div>
        </dl>
      </div>
      <button className="knopf sekundaer" onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ text });
          else { await navigator.clipboard.writeText(text); melde("In die Zwischenablage kopiert"); }
        } catch (e) { /* abgebrochen */ }
      }}><Icon name="tauschen" groesse={18} />Teilen oder kopieren</button>
    </div>
  );
}

function NeuDialog({ liste, onClose, onFertig }) {
  const [name, setName] = useState("");
  const [benutzer, setBenutzer] = useState("");
  const [code, setCode] = useState(zufallsCode());
  const [rolle, setRolle] = useState("mitarbeiter");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const sauber = sauberName(benutzer);
  const vergeben = liste.some((u) => u.username === sauber);
  const bereit = name.trim() && sauber.length >= 3 && !vergeben && code.length >= 6 && !laeuft;

  function nameAendern(v) {
    const alt = sauberName(name.split(" ")[0] || "");
    setName(v);
    if (!benutzer || sauberName(benutzer) === alt) setBenutzer(sauberName(v.split(" ")[0] || ""));
  }

  async function anlegen() {
    setLaeuft(true);
    setFehler(null);
    try {
      await api.nutzerAnlegen(name.trim(), sauber, code, rolle);
      await onFertig({ name: name.trim(), username: sauber, code });
    } catch (e) { setFehler(e.message); setLaeuft(false); }
  }

  return (
    <Dialog offen titel="Zugang anlegen" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" disabled={!bereit} onClick={anlegen}>{laeuft ? "Wird angelegt …" : "Zugang anlegen"}</button></>}>
      <div>
        <Feld label="Name"><input className="eingabe" value={name} onChange={(e) => nameAendern(e.target.value)} placeholder="z. B. Max Keller" autoFocus /></Feld>
        <Feld label="Benutzername" fehler={sauber.length >= 3 && vergeben ? "Dieser Benutzername ist schon vergeben." : null} hilfe="Damit meldet sich die Person an">
          <input className="eingabe" value={benutzer} onChange={(e) => setBenutzer(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </Feld>
        <Feld label="Zugangscode" hilfe="6 bis 8 Ziffern. Vorschlag ist zufällig erzeugt.">
          <span className="reihe">
            <input className="eingabe" inputMode="numeric" value={code} onChange={(e) => setCode(nurZiffern(e.target.value))} style={{ letterSpacing: "0.12em" }} />
            <button type="button" className="knopf sekundaer rund" onClick={() => setCode(zufallsCode())} aria-label="Neuen Code erzeugen" title="Neuen Code erzeugen"><Icon name="verlauf" groesse={18} /></button>
          </span>
        </Feld>
        <div className="feld">
          <span className="feld-label">Rolle</span>
          <div className="stapel-s">
            {[["mitarbeiter", "Mitarbeiter", "Eigene Zeiten erfassen, umbuchen, Material buchen"], ["admin", "Admin", "Darf zusätzlich anlegen, bearbeiten und Zeiten für alle erfassen"]].map(([k, l, t]) => (
              <button key={k} type="button" className={"auswahl" + (rolle === k ? " aktiv" : "")} style={{ height: "auto", padding: "10px 14px" }} onClick={() => setRolle(k)} aria-pressed={rolle === k}>
                <span className="zeile-mitte"><span>{l}</span><span className="leise klein" style={{ fontWeight: 450 }}>{t}</span></span>
                {rolle === k && <Icon name="haken" groesse={18} className="auswahl-haken" />}
              </button>
            ))}
          </div>
        </div>
        {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
      </div>
    </Dialog>
  );
}

function PersonDialog({ person, istIch, onClose, onFertig }) {
  const [name, setName] = useState(person.name);
  const [rolle, setRolle] = useState(person.rolle);
  const [codeModus, setCodeModus] = useState(false);
  const [code, setCode] = useState(zufallsCode());
  const [neuerCode, setNeuerCode] = useState(null);
  const [loeschen, setLoeschen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  async function ausfuehren(fn, text) {
    setLaeuft(true);
    setFehler(null);
    try { await fn(); await onFertig(text); } catch (e) { setFehler(e.message); setLaeuft(false); }
  }

  async function codeSpeichern() {
    setLaeuft(true);
    setFehler(null);
    try { await api.nutzerPatch(person.id, { code }); setNeuerCode(code); setCodeModus(false); }
    catch (e) { setFehler(e.message); }
    setLaeuft(false);
  }

  const geaendert = name.trim() !== person.name || rolle !== person.rolle;

  if (neuerCode) {
    return (
      <Dialog offen titel="Neuer Code vergeben" onClose={() => onFertig("Neuer Code vergeben")}
        fuss={<button className="knopf primaer" onClick={() => onFertig("Neuer Code vergeben")}>Fertig</button>}>
        <ZugangsKarte name={person.name} username={person.username} code={neuerCode} />
      </Dialog>
    );
  }

  return (
    <>
      <Dialog offen={!loeschen} titel={person.name} onClose={onClose}
        fuss={<><button className="knopf sekundaer" onClick={onClose}>Schließen</button>
          <button className="knopf primaer" disabled={!geaendert || !name.trim() || laeuft}
            onClick={() => ausfuehren(() => api.nutzerPatch(person.id, { name: name.trim(), rolle }), "Änderungen gespeichert")}>Speichern</button></>}>
        <div>
          <Feld label="Name"><input className="eingabe" value={name} onChange={(e) => setName(e.target.value)} /></Feld>
          <Feld label="Benutzername"><input className="eingabe" value={person.username} disabled /></Feld>
          <div className="feld">
            <span className="feld-label">Rolle</span>
            <Segment breit optionen={[["mitarbeiter", "Mitarbeiter"], ["admin", "Admin"]]} wert={rolle} setzen={istIch ? () => {} : setRolle} />
            {istIch && <span className="feld-hilfe">Deine eigene Rolle kannst du nicht ändern.</span>}
          </div>

          <div className="trenner" />
          <div className="feld">
            <span className="feld-label">Zugangscode</span>
            {!codeModus ? (
              <>
                <span className="feld-hilfe" style={{ marginBottom: 6 }}>Code vergessen? Vergib einen neuen. Der alte Code gilt danach nicht mehr und offene Anmeldungen werden beendet.</span>
                <button type="button" className="knopf sekundaer" onClick={() => setCodeModus(true)}><Icon name="schluessel" groesse={18} />Neuen Code vergeben</button>
              </>
            ) : (
              <>
                <span className="reihe">
                  <input className="eingabe" inputMode="numeric" value={code} onChange={(e) => setCode(nurZiffern(e.target.value))} style={{ letterSpacing: "0.12em" }} />
                  <button type="button" className="knopf sekundaer rund" onClick={() => setCode(zufallsCode())} aria-label="Neuen Code erzeugen"><Icon name="verlauf" groesse={18} /></button>
                </span>
                <span className="reihe" style={{ marginTop: 8 }}>
                  <button type="button" className="knopf geist" onClick={() => setCodeModus(false)}>Abbrechen</button>
                  <button type="button" className="knopf primaer" disabled={code.length < 6 || laeuft} onClick={codeSpeichern}>Code speichern</button>
                </span>
              </>
            )}
          </div>

          {!istIch && (
            <>
              <div className="trenner" />
              <button type="button" className="knopf gefahr-leise" onClick={() => setLoeschen(true)}><Icon name="loeschen" groesse={18} />Zugang löschen</button>
            </>
          )}
          {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
        </div>
      </Dialog>
      <Bestaetigen offen={loeschen} titel="Zugang löschen?" laeuft={laeuft} knopf="Zugang löschen"
        text={`${person.name} kann sich danach nicht mehr anmelden. Einträge im Verlauf bleiben erhalten.`}
        onNein={() => setLoeschen(false)} onJa={() => ausfuehren(() => api.nutzerLoeschen(person.id), "Zugang gelöscht")} />
    </>
  );
}

function Fahrzeuge() {
  const { vehicles, tools, neuLaden, melde } = useDaten();
  const [neu, setNeu] = useState(false);
  const [name, setName] = useState("");
  const [kz, setKz] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [loeschen, setLoeschen] = useState(null);

  async function anlegen() {
    setLaeuft(true);
    try { await api.fahrzeugAnlegen(name.trim(), kz.trim()); await neuLaden(); melde("Fahrzeug angelegt"); setNeu(false); setName(""); setKz(""); }
    catch (e) { melde(e.message, "fehler"); }
    setLaeuft(false);
  }

  return (
    <>
      <div className="karte">
        <div className="karte-kopf">
          <h2 className="titel-s">{vehicles.length} {vehicles.length === 1 ? "Fahrzeug" : "Fahrzeuge"}</h2>
          <button className="knopf primaer klein" onClick={() => setNeu(true)}><Icon name="plus" groesse={16} />Fahrzeug anlegen</button>
        </div>
        {!vehicles.length ? (
          <Leer icon="transporter" titel="Noch keine Fahrzeuge" text="Lege Transporter und Anhänger an, damit Geräte darauf gebucht werden können." />
        ) : (
          <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
            {vehicles.map((v) => {
              const anzahl = tools.filter((t) => t.ort_id === v.id).length;
              return (
                <div key={v.id} className="zeile">
                  <Kachel thumb={v.thumb} art="transporter" />
                  <Link href={`/dashboard/orte/${v.id}`} className="zeile-mitte">
                    <span className="zeile-titel">{v.name}</span>
                    <span className="zeile-sub">
                      {v.kennzeichen && <span className="kennzeichen">{v.kennzeichen}</span>}
                      <span>{anzahl} Geräte</span>
                    </span>
                  </Link>
                  <span className="zeile-rechts">
                    <Status status={v.status || "ok"} kurz />
                    <button className="knopf geist rund klein" onClick={() => setLoeschen(v)} aria-label={`${v.name} entfernen`} title="Entfernen"><Icon name="loeschen" groesse={17} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog offen={neu} titel="Fahrzeug anlegen" onClose={() => setNeu(false)}
        fuss={<><button className="knopf sekundaer" onClick={() => setNeu(false)}>Abbrechen</button>
          <button className="knopf primaer" disabled={!name.trim() || laeuft} onClick={anlegen}>Fahrzeug anlegen</button></>}>
        <Feld label="Bezeichnung"><input className="eingabe" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Sprinter Kolonne 2" autoFocus /></Feld>
        <Feld label="Kennzeichen"><input className="eingabe" value={kz} onChange={(e) => setKz(e.target.value)} placeholder="z. B. BIT-GS 120" /></Feld>
      </Dialog>

      <Bestaetigen offen={!!loeschen} titel="Fahrzeug entfernen?" knopf="Entfernen" laeuft={laeuft}
        text={loeschen ? `„${loeschen.name}“ wird entfernt. Geräte, die darauf gebucht sind, wandern zurück ins Lager.` : ""}
        onNein={() => setLoeschen(null)}
        onJa={async () => {
          setLaeuft(true);
          try { await api.fahrzeugLoeschen(loeschen.id); await neuLaden(); melde("Fahrzeug entfernt"); setLoeschen(null); }
          catch (e) { melde(e.message, "fehler"); }
          setLaeuft(false);
        }} />
    </>
  );
}
