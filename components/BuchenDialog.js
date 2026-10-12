"use client";
import { useState } from "react";
import Icon from "./Icon";
import { useDaten } from "./DatenKontext";
import { Dialog, Feld, Hinweis, Segment } from "./ui";
import { zahlText } from "@/lib/format";

const SCHNELL = { Sack: [1, 5, 10, 20], Palette: [1, 2, 5, 10], Stück: [1, 5, 10, 50], t: [0.5, 1, 2, 5], "m³": [0.5, 1, 2, 5] };

function parse(v) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

// Entnahme / Zugang / Inventur für einen Lagerartikel.
// festAuftrag: Buchung gehört fest zu diesem Auftrag (Verbrauch oder Rückgabe).
// rueckgabe: Material vom Auftrag zurück ins Lager (maxMenge = bisher verbraucht).
export default function BuchenDialog({ material, startArt = "abgang", istAdmin, festAuftrag, rueckgabe, maxMenge, onClose, onBuchen }) {
  const { auftraege } = useDaten();
  const [art, setArt] = useState(rueckgabe ? "zugang" : startArt);
  const [menge, setMenge] = useState(startArt === "korrektur" ? String(material.bestand).replace(".", ",") : "");
  const [notiz, setNotiz] = useState("");
  const [auftragId, setAuftragId] = useState(festAuftrag?.id || "");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const n = parse(menge);
  const bestand = Number(material.bestand || 0);
  const neu = art === "zugang" ? bestand + n : art === "abgang" ? bestand - n : n;
  const zuViel = art === "abgang" && n > bestand;
  const ueberRueckgabe = rueckgabe && maxMenge !== undefined && n > maxMenge;
  const gueltig = Number.isFinite(n) && (art === "korrektur" ? n >= 0 : n > 0) && !zuViel && !ueberRueckgabe;
  const schnell = SCHNELL[material.einheit] || [1, 5, 10, 25];
  const offeneAuftraege = auftraege.filter((a) => a.status !== "abgeschlossen");
  const mitAuftrag = festAuftrag || (art === "abgang" && offeneAuftraege.length > 0);

  function schritt(d) {
    const basis = Number.isFinite(n) ? n : 0;
    setMenge(String(Math.max(0, Math.round((basis + d) * 100) / 100)).replace(".", ","));
  }

  async function buchen() {
    if (!gueltig || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      await onBuchen(art, n, notiz.trim(), art === "abgang" || rueckgabe ? auftragId || null : null);
    } catch (e) {
      setFehler(e.message);
      setLaeuft(false);
    }
  }

  const titel = rueckgabe ? "Zurück ins Lager" : festAuftrag ? "Material verbraucht" : { abgang: "Material entnehmen", zugang: "Zugang buchen", korrektur: "Bestand korrigieren" }[art];
  const knopf = rueckgabe ? "Zurückbuchen" : festAuftrag ? "Verbrauch buchen" : { abgang: "Entnahme buchen", zugang: "Zugang buchen", korrektur: "Bestand speichern" }[art];
  const optionen = [["abgang", "Entnehmen"], ["zugang", "Zugang"]];
  if (istAdmin) optionen.push(["korrektur", "Inventur"]);

  return (
    <Dialog offen titel={titel} onClose={onClose}
      fuss={<><button className="knopf sekundaer" onClick={onClose}>Abbrechen</button>
        <button className={"knopf " + (art === "zugang" && !rueckgabe ? "akzent" : "primaer")} onClick={buchen} disabled={!gueltig || laeuft}>
          {laeuft ? "Wird gebucht …" : knopf}
        </button></>}>
      <div className="stapel">
        <div>
          <div className="zeile-titel">{material.name}</div>
          <div className="leise klein">
            Auf Lager: <strong>{zahlText(bestand)} {material.einheit}</strong>
            {rueckgabe && maxMenge !== undefined && <>. Auf dem Auftrag verbraucht: <strong>{zahlText(maxMenge)} {material.einheit}</strong></>}
          </div>
          {festAuftrag && <div className="leise klein">Auftrag: <strong>{festAuftrag.titel}</strong></div>}
        </div>
        {!festAuftrag && (
          <Segment breit optionen={optionen} wert={art} setzen={(a) => { setArt(a); setMenge(a === "korrektur" ? String(bestand).replace(".", ",") : ""); setFehler(null); }} />
        )}

        <div className="feld">
          <span className="feld-label">{art === "korrektur" ? `Gezählter Bestand (${material.einheit})` : `Menge (${material.einheit})`}</span>
          <div className="mengenwahl">
            <button type="button" className="knopf sekundaer" onClick={() => schritt(-1)} aria-label="Weniger"><Icon name="minus" groesse={22} /></button>
            <input className="eingabe" inputMode="decimal" value={menge} autoFocus placeholder="0"
              onChange={(e) => setMenge(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") buchen(); }} />
            <button type="button" className="knopf sekundaer" onClick={() => schritt(1)} aria-label="Mehr"><Icon name="plus" groesse={22} /></button>
          </div>
          {art !== "korrektur" && (
            <div className="schnellwahl">
              {rueckgabe && maxMenge !== undefined
                ? <button type="button" style={{ gridColumn: "1 / -1" }} onClick={() => setMenge(String(maxMenge).replace(".", ","))}>Alles: {zahlText(maxMenge)} {material.einheit}</button>
                : schnell.map((s) => <button key={s} type="button" onClick={() => setMenge(String(s).replace(".", ","))}>{zahlText(s)}</button>)}
            </div>
          )}
        </div>

        {Number.isFinite(n) && menge !== "" && (
          zuViel ? <Hinweis art="fehler">Es sind nur {zahlText(bestand)} {material.einheit} auf Lager.</Hinweis>
            : ueberRueckgabe ? <Hinweis art="fehler">Auf diesem Auftrag wurden nur {zahlText(maxMenge)} {material.einheit} verbraucht.</Hinweis>
              : <Hinweis>Neuer Lagerbestand: <strong>{zahlText(neu)} {material.einheit}</strong></Hinweis>
        )}

        {mitAuftrag && !festAuftrag && (
          <Feld label="Für Auftrag" hilfe="Optional. So siehst du später, wo das Material verbaut wurde.">
            <select className="eingabe" value={auftragId} onChange={(e) => setAuftragId(e.target.value)}>
              <option value="">Kein Auftrag</option>
              {offeneAuftraege.map((a) => <option key={a.id} value={a.id}>{a.titel}{a.kunde ? ` (${a.kunde})` : ""}</option>)}
            </select>
          </Feld>
        )}

        <Feld label="Notiz" hilfe={art === "abgang" ? "z. B. wofür" : art === "zugang" ? (rueckgabe ? "z. B. Rest übrig" : "z. B. Lieferant oder Lieferschein") : "z. B. Inventur Oktober"}>
          <input className="eingabe" value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="optional" />
        </Feld>
        {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}
