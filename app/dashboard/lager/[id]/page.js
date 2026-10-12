"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import FotoKnopf from "@/components/Foto";
import BuchenDialog from "@/components/BuchenDialog";
import MaterialFormular, { leeresMaterial } from "@/components/MaterialFormular";
import { useDaten } from "@/components/DatenKontext";
import { Bestaetigen, Dialog, Fuellstand, Hinweis, Laden, Leer, Seitenkopf } from "@/components/ui";
import { bestandsLage, euro, zahlText, zeigeZeit } from "@/lib/format";
import { api } from "@/lib/api";

const ART_TEXT = { zugang: "Zugang", abgang: "Entnahme", korrektur: "Inventur", angelegt: "Angelegt" };

export default function MaterialSeite() {
  const { id } = useParams();
  const router = useRouter();
  const { materials, laden, istAdmin, neuLaden, melde } = useDaten();
  const [bewegungen, setBewegungen] = useState(null);
  const [dialog, setDialog] = useState(null); // {art} | "bearbeiten" | "loeschen"
  const [alle, setAlle] = useState(false);

  const ladeBewegungen = useCallback(async () => {
    try { setBewegungen(await api.materialBewegungen(id)); } catch (e) { setBewegungen([]); }
  }, [id]);
  useEffect(() => { ladeBewegungen(); }, [ladeBewegungen]);

  if (laden) return <Laden />;
  const m = materials.find((x) => x.id === id);
  if (!m) {
    return (
      <div className="karte">
        <Leer icon="suche" titel="Material nicht gefunden" text="Es wurde vielleicht gelöscht.">
          <button className="knopf sekundaer" onClick={() => router.push("/dashboard/lager")}>Zum Lager</button>
        </Leer>
      </div>
    );
  }

  const lage = bestandsLage(m);
  const wert = m.preis ? Number(m.preis) * Number(m.bestand || 0) : null;

  async function gebucht(art, menge, notiz) {
    await api.materialBuchen(m.id, art, menge, notiz);
    await Promise.all([neuLaden(), ladeBewegungen()]);
    melde(art === "abgang" ? "Entnahme gebucht" : art === "zugang" ? "Zugang gebucht" : "Bestand korrigiert");
    setDialog(null);
  }

  const liste = bewegungen || [];

  return (
    <div>
      <Seitenkopf zurueck={{ href: "/dashboard/lager", text: "Lager" }} titel={m.name}
        sub={<span className="reihe umbruch" style={{ gap: 8 }}>
          {m.kategorie && <span>{m.kategorie}</span>}
          {m.artikel_nr && <span className="marke-klein">{m.artikel_nr}</span>}
        </span>}
        aktionen={istAdmin && <button className="knopf sekundaer" onClick={() => setDialog("bearbeiten")}><Icon name="bearbeiten" groesse={18} />Bearbeiten</button>} />

      <div className="raster-haupt">
        <div className="stapel">
          <div className="karte bestandskarte">
            <div className="reihe zwischen" style={{ alignItems: "flex-end" }}>
              <div>
                <div className="leise klein" style={{ marginBottom: 6 }}>Auf Lager</div>
                <div className="reihe" style={{ alignItems: "baseline", gap: 8 }}>
                  <span className={"zahl-gross " + (lage === "ok" ? "" : "ist-" + lage)}>{zahlText(m.bestand)}</span>
                  <span className="titel-m leise" style={{ fontWeight: 560 }}>{m.einheit}</span>
                </div>
              </div>
              {lage !== "ok" && <span className={"status " + (lage === "leer" ? "defekt" : "wartung")}>{lage === "leer" ? "Nicht auf Lager" : "Nachbestellen"}</span>}
            </div>
            <Fuellstand m={m} />
            <div className="leise klein">
              {m.mindestbestand !== null ? `Mindestbestand: ${zahlText(m.mindestbestand)} ${m.einheit}` : "Kein Mindestbestand festgelegt"}
              {m.lagerort ? `. Lagerplatz: ${m.lagerort}` : ""}
            </div>
            <div className="bestandskarte-aktionen">
              <button className="knopf primaer gross" onClick={() => setDialog({ art: "abgang" })} disabled={Number(m.bestand) <= 0}><Icon name="minus" groesse={18} />Entnehmen</button>
              <button className="knopf akzent gross" onClick={() => setDialog({ art: "zugang" })}><Icon name="plus" groesse={18} />Zugang</button>
            </div>
            {istAdmin && <button className="knopf geist breit" onClick={() => setDialog({ art: "korrektur" })}><Icon name="inventur" groesse={18} />Inventur: Bestand korrigieren</button>}
          </div>

          {m.notiz && <Hinweis>{m.notiz}</Hinweis>}

          <div className="karte">
            <div className="karte-kopf"><h2 className="titel-s reihe" style={{ gap: 8 }}><Icon name="verlauf" groesse={18} className="sehr-leise" />Bewegungen</h2></div>
            {bewegungen === null ? <Laden /> : !liste.length ? (
              <p className="leise klein" style={{ padding: "0 20px 18px" }}>Noch keine Buchungen.</p>
            ) : (
              <ul className="zeitleiste">
                {(alle ? liste : liste.slice(0, 8)).map((b) => {
                  const menge = Number(b.menge);
                  return (
                    <li key={b.id} className={b.art === "angelegt" ? "" : menge >= 0 ? "plus" : "minus"}>
                      <div className="reihe zwischen" style={{ alignItems: "flex-start" }}>
                        <div>
                          <div className="zeit-text">
                            {ART_TEXT[b.art]}
                            {b.art !== "angelegt" && <span style={{ color: menge >= 0 ? "var(--ok)" : "var(--warn)", marginLeft: 6 }}>{menge >= 0 ? "+" : "−"}{zahlText(Math.abs(menge))} {m.einheit}</span>}
                          </div>
                          {b.notiz && <div className="klein">{b.notiz}</div>}
                          <div className="zeit-meta">{zeigeZeit(b.created_at)}{b.wer ? `, ${b.wer}` : ""}</div>
                        </div>
                        <span className="leise klein" style={{ whiteSpace: "nowrap" }}>Bestand {zahlText(b.bestand_nach)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {liste.length > 8 && (
              <div style={{ padding: "0 20px 16px" }}>
                <button className="textlink klein" onClick={() => setAlle(!alle)}>{alle ? "Weniger anzeigen" : `Alle ${liste.length} Bewegungen anzeigen`}</button>
              </div>
            )}
          </div>
        </div>

        <div className="stapel">
          <div className="karte">
            <div className="karte-kopf"><h2 className="titel-s">Details</h2></div>
            <dl className="datenliste" style={{ margin: 0 }}>
              <div><dt>Einheit</dt><dd>{m.einheit}</dd></div>
              <div><dt>Lagerplatz</dt><dd>{m.lagerort || "–"}</dd></div>
              <div><dt>Preis je Einheit</dt><dd>{euro(m.preis)}</dd></div>
              <div><dt>Lagerwert</dt><dd>{wert !== null ? euro(wert) : "–"}</dd></div>
            </dl>
          </div>
          {istAdmin && (
            <>
              <div className="karte">
                <div className="karte-kopf"><h2 className="titel-s">Foto</h2></div>
                <div className="karte-innen" style={{ paddingTop: 0 }}>
                  {m.hat_bild && m.foto_url && <img src={m.foto_url} alt="" style={{ borderRadius: 12, marginBottom: 12, width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />}
                  <FotoKnopf art="material" id={m.id} hatBild={!!m.hat_bild} onFertig={neuLaden} melde={melde} />
                </div>
              </div>
              <button className="knopf gefahr-leise" onClick={() => setDialog("loeschen")} style={{ alignSelf: "flex-start" }}><Icon name="loeschen" groesse={18} />Material löschen</button>
            </>
          )}
        </div>
      </div>

      {dialog && dialog.art && <BuchenDialog material={m} startArt={dialog.art} istAdmin={istAdmin} onClose={() => setDialog(null)} onBuchen={gebucht} />}
      {dialog === "bearbeiten" && <Bearbeiten m={m} materials={materials} onClose={() => setDialog(null)}
        onSpeichern={async (f) => { await api.materialPatch(m.id, f); await neuLaden(); melde("Änderungen gespeichert"); setDialog(null); }} />}
      <Bestaetigen offen={dialog === "loeschen"} titel="Material löschen?" knopf="Endgültig löschen"
        text={`„${m.name}“ wird mit allen Bewegungen endgültig gelöscht.`} onNein={() => setDialog(null)}
        onJa={async () => {
          try { await api.materialLoeschen(m.id); await neuLaden(); melde("Material gelöscht"); router.push("/dashboard/lager"); }
          catch (e) { melde(e.message, "fehler"); }
        }} />
    </div>
  );
}

function Bearbeiten({ m, materials, onClose, onSpeichern }) {
  const [f, setF] = useState(leeresMaterial(m));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  async function speichern() {
    setLaeuft(true);
    setFehler(null);
    const { bestand, ...rest } = f;
    try { await onSpeichern(rest); } catch (e) { setFehler(e.message); setLaeuft(false); }
  }
  return (
    <Dialog offen titel="Material bearbeiten" onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className="knopf primaer" disabled={!f.name.trim() || laeuft} onClick={speichern}>Speichern</button></>}>
      <MaterialFormular f={f} setF={setF} materials={materials} />
      {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
      <p className="feld-hilfe" style={{ marginTop: 14 }}>Den Bestand änderst du über Entnehmen, Zugang oder Inventur, damit jede Änderung nachvollziehbar bleibt.</p>
    </Dialog>
  );
}
