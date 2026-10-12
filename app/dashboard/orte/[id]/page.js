"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FotoKnopf from "@/components/Foto";
import Verlauf from "@/components/Verlauf";
import { useDaten } from "@/components/DatenKontext";
import { Dialog, Feld, Kachel, Laden, Leer, Seitenkopf, Status } from "@/components/ui";
import { LAGER, STATUS, artFuer, bestandsLage, fristText, vergleich, zeigeDatum } from "@/lib/format";
import { api } from "@/lib/api";

export default function OrtSeite() {
  const { id } = useParams();
  const router = useRouter();
  const { vehicles, tools, materials, laden, istAdmin, neuLaden, melde } = useDaten();
  const [dialog, setDialog] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  if (laden) return <Laden />;
  const ort = id === "lager" ? LAGER : vehicles.find((v) => v.id === id);
  if (!ort) {
    return (
      <div className="karte">
        <Leer icon="suche" titel="Standort nicht gefunden">
          <button className="knopf sekundaer" onClick={() => router.push("/dashboard")}>Zur Übersicht</button>
        </Leer>
      </div>
    );
  }

  const istFahrzeug = ort.id !== "lager";
  const drin = tools.filter((t) => t.ort_id === ort.id).sort((a, b) => vergleich(a.name, b.name));
  const auf = drin.filter((t) => (t.status || "ok") !== "ok").length;
  const tage = ort.faellig ? Math.round((new Date(ort.faellig) - new Date()) / 86400000) : null;
  const knapp = materials.filter((m) => bestandsLage(m) !== "ok").length;

  async function aktion(fn, erfolg) {
    setLaeuft(true);
    try { await fn(); await neuLaden(); melde(erfolg); setDialog(null); } catch (e) { melde(e.message, "fehler"); }
    setLaeuft(false);
  }

  return (
    <div>
      <Seitenkopf zurueck={{ href: "/dashboard", text: "Übersicht" }} titel={ort.name}
        sub={<span className="reihe umbruch" style={{ gap: 8 }}>
          {ort.kennzeichen && <span className="kennzeichen">{ort.kennzeichen}</span>}
          {istFahrzeug && <Status status={ort.status || "ok"} />}
          <span>{drin.length} Geräte{auf ? `, ${auf} auffällig` : ""}</span>
        </span>}
        aktionen={istAdmin && istFahrzeug && <button className="knopf sekundaer" onClick={() => setDialog("bearbeiten")}><Icon name="bearbeiten" groesse={18} />Bearbeiten</button>}
      />

      <div className="raster-haupt">
        <div className="stapel">
          {istFahrzeug && ort.hat_bild && ort.foto_url && <div className="titelbild" style={{ marginBottom: 0 }}><img src={ort.foto_url} alt={ort.name} /></div>}

          {istFahrzeug && (
            <div className="karte">
              <div className="karte-kopf">
                <h2 className="titel-s">Fahrzeugzustand</h2>
                <button className="knopf sekundaer klein" onClick={() => setDialog("zustand")}>Ändern</button>
              </div>
              <dl className="datenliste" style={{ margin: 0 }}>
                <div><dt>Zustand</dt><dd>{(STATUS[ort.status || "ok"] || STATUS.ok).label}</dd></div>
                <div>
                  <dt>Nächster Termin</dt>
                  <dd className={tage !== null ? (tage < 0 ? "ueberfaellig" : tage <= 30 ? "bald" : "") : ""}>
                    {ort.faellig ? `${zeigeDatum(ort.faellig)} (${fristText(tage)})` : "–"}
                  </dd>
                </div>
              </dl>
              {ort.notiz && <div className="notiz-anzeige" style={{ marginTop: 0 }}>{ort.notiz}</div>}
            </div>
          )}

          {!istFahrzeug && (
            <Link href="/dashboard/lager" className="karte karte-innen reihe" style={{ gap: 14 }}>
              <Kachel art="lager" />
              <span className="zeile-mitte">
                <span className="zeile-titel">Materialbestand</span>
                <span className="zeile-sub">{materials.length} Artikel{knapp ? `, ${knapp} knapp` : ""}</span>
              </span>
              <Icon name="weiter" className="chevron sehr-leise" />
            </Link>
          )}

          <div className="karte">
            <div className="karte-kopf">
              <h2 className="titel-s">{istFahrzeug ? "Geräte an Bord" : "Geräte im Lager"}</h2>
              {istAdmin && <Link href={`/dashboard/geraete/neu?ort=${ort.id}`} className="knopf sekundaer klein"><Icon name="plus" groesse={16} />Gerät erfassen</Link>}
            </div>
            {!drin.length ? (
              <p className="leise klein" style={{ padding: "0 20px 18px" }}>Hier ist gerade kein Gerät. Geräte bucht man auf der Geräteseite über „Umbuchen“ hierher.</p>
            ) : (
              <div className="liste-zeilen" style={{ borderTop: "1px solid var(--linie)" }}>
                {drin.map((t) => (
                  <Link key={t.id} href={`/dashboard/geraete/${t.id}`} className="zeile">
                    <Kachel thumb={t.thumb} art={artFuer(t)} />
                    <span className="zeile-mitte">
                      <span className="zeile-titel">{t.name}</span>
                      <span className="zeile-sub">
                        {t.inv_nr && <span className="marke-klein">{t.inv_nr}</span>}
                        {t.kategorie && <span>{t.kategorie}</span>}
                      </span>
                    </span>
                    <span className="zeile-rechts"><Status status={t.status} kurz /><Icon name="weiter" groesse={18} className="chevron" /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {istFahrzeug && <Verlauf log={ort.log} istAdmin={istAdmin} onLeeren={() => aktion(() => api.fahrzeugPatch(ort.id, { logtext: null }), "Verlauf geleert")} />}
        </div>

        {istFahrzeug && istAdmin && (
          <div className="stapel">
            <div className="karte">
              <div className="karte-kopf"><h2 className="titel-s">Foto</h2></div>
              <div className="karte-innen" style={{ paddingTop: 0 }}>
                <FotoKnopf art="vehicle" id={ort.id} hatBild={!!ort.hat_bild} onFertig={neuLaden} melde={melde} />
              </div>
            </div>
          </div>
        )}
      </div>

      {dialog === "zustand" && (
        <ZustandDialog ort={ort} laeuft={laeuft} onClose={() => setDialog(null)}
          onSpeichern={(st, text, frist) => aktion(
            () => api.fahrzeugPatch(ort.id, {
              status: st, notiz: text, faellig: frist || null,
              logtext: STATUS[st].label + (text ? ": " + text : "") + (frist ? `, Termin ${zeigeDatum(frist)}` : ""),
            }),
            "Fahrzeug aktualisiert",
          )} />
      )}
      {dialog === "bearbeiten" && (
        <FahrzeugBearbeiten ort={ort} laeuft={laeuft} onClose={() => setDialog(null)}
          onSpeichern={(name, kennzeichen) => aktion(() => api.fahrzeugPatch(ort.id, { name, kennzeichen }), "Änderungen gespeichert")} />
      )}
    </div>
  );
}

function ZustandDialog({ ort, laeuft, onClose, onSpeichern }) {
  const [st, setSt] = useState(ort.status || "ok");
  const [text, setText] = useState(ort.notiz || "");
  const [frist, setFrist] = useState(ort.faellig || "");
  return (
    <Dialog offen titel="Fahrzeugzustand" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" disabled={laeuft} onClick={() => onSpeichern(st, text.trim(), frist)}>Speichern</button></>}>
      <div className="stapel">
        <div className="stapel-s">
          {["ok", "wartung", "defekt", "weg"].map((k) => (
            <button key={k} type="button" className={"auswahl" + (st === k ? " aktiv" : "")} onClick={() => setSt(k)} aria-pressed={st === k}>
              <span className={"auswahl-punkt " + k} />{STATUS[k].label}
              {st === k && <Icon name="haken" groesse={18} className="auswahl-haken" />}
            </button>
          ))}
        </div>
        <Feld label="Kommentar"><textarea className="eingabe" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Bremse hinten links schleift" /></Feld>
        <Feld label="Nächster Termin" hilfe="z. B. TÜV, Inspektion oder Werkstatt"><input className="eingabe" type="date" value={frist} onChange={(e) => setFrist(e.target.value)} /></Feld>
      </div>
    </Dialog>
  );
}

function FahrzeugBearbeiten({ ort, laeuft, onClose, onSpeichern }) {
  const [name, setName] = useState(ort.name || "");
  const [kz, setKz] = useState(ort.kennzeichen || "");
  return (
    <Dialog offen titel="Fahrzeug bearbeiten" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" disabled={!name.trim() || laeuft} onClick={() => onSpeichern(name.trim(), kz.trim().toUpperCase())}>Speichern</button></>}>
      <Feld label="Bezeichnung"><input className="eingabe" value={name} onChange={(e) => setName(e.target.value)} /></Feld>
      <Feld label="Kennzeichen"><input className="eingabe" value={kz} onChange={(e) => setKz(e.target.value)} placeholder="z. B. BIT-GS 120" /></Feld>
    </Dialog>
  );
}
