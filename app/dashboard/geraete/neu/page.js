"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { Feld, Hinweis, Kachel, Leer, Seitenkopf } from "@/components/ui";
import { LAGER, artFuer, vergleich } from "@/lib/format";
import { api } from "@/lib/api";

const STANDARD_KATEGORIEN = ["Motorgeräte", "Rasenpflege", "Handwerkzeug", "Anhänger", "Maschinen", "Messgeräte", "Sicherheit"];
const INTERVALLE = [["", "Keins"], ["6", "6 Monate"], ["12", "12 Monate"], ["24", "24 Monate"]];

function naechsteInventarnummer(tools) {
  let max = 0;
  let praefix = "GS-";
  tools.forEach((t) => {
    const m = /^([A-Za-z]+-?)(\d+)$/.exec((t.inv_nr || "").trim());
    if (m && Number(m[2]) >= max) { max = Number(m[2]); praefix = m[1]; }
  });
  return `${praefix}${String(max + 1).padStart(4, "0")}`;
}

export default function NeuesGeraet() {
  const params = useSearchParams();
  const router = useRouter();
  const { vehicles, tools, istAdmin, neuLaden, melde } = useDaten();
  const orte = [LAGER, ...vehicles];
  const vorschlagNr = naechsteInventarnummer(tools);

  const [f, setF] = useState({ name: "", kategorie: "", invNr: vorschlagNr, serien: "", ort: params.get("ort") || "lager", intervall: "" });
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!istAdmin) {
    return <div className="karte"><Leer icon="schloss" titel="Nur für Admins" text="Neue Geräte kann nur ein Admin erfassen." /></div>;
  }

  const kategorien = Array.from(new Set([...tools.map((t) => t.kategorie).filter(Boolean), ...STANDARD_KATEGORIEN])).sort(vergleich).slice(0, 12);
  const intervallEigen = f.intervall && !INTERVALLE.some(([k]) => k === f.intervall);

  async function speichern(e) {
    e.preventDefault();
    if (!f.name.trim() || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const g = await api.toolAnlegen(f);
      await neuLaden();
      melde("Gerät erfasst");
      router.replace(`/dashboard/geraete/${g.id}`);
    } catch (err) {
      setFehler(err.message);
      setLaeuft(false);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <Seitenkopf zurueck={{ href: "/dashboard/geraete", text: "Geräte" }} titel="Gerät erfassen" sub="Ein Foto kannst du gleich im nächsten Schritt hinzufügen." />
      <form className="karte karte-innen" onSubmit={speichern} noValidate>
        <div className="reihe" style={{ marginBottom: 18, gap: 14 }}>
          <Kachel art={artFuer(f)} groesse="gross" />
          <div className="zeile-mitte">
            <span className="titel-m">{f.name || "Neues Gerät"}</span>
            <span className="leise klein">{f.kategorie || "Ohne Kategorie"}</span>
          </div>
        </div>

        <Feld label="Bezeichnung">
          <input className="eingabe" value={f.name} onChange={set("name")} placeholder="z. B. Stihl MS 261 Motorsäge" autoFocus />
        </Feld>
        <div className="feld">
          <span className="feld-label">Kategorie</span>
          <input className="eingabe" value={f.kategorie} onChange={set("kategorie")} placeholder="Eigene Kategorie eingeben oder unten wählen" />
          <div className="vorschlaege">
            {kategorien.map((k) => (
              <button type="button" key={k} className={"vorschlag" + (f.kategorie === k ? " aktiv" : "")} onClick={() => setF({ ...f, kategorie: f.kategorie === k ? "" : k })}>{k}</button>
            ))}
          </div>
        </div>
        <div className="feldreihe">
          <Feld label="Inventarnummer" hilfe="Vorschlag, kann geändert werden"><input className="eingabe" value={f.invNr} onChange={set("invNr")} /></Feld>
          <Feld label="Seriennummer"><input className="eingabe" value={f.serien} onChange={set("serien")} placeholder="optional" /></Feld>
        </div>
        <Feld label="Standort">
          <select className="eingabe" value={f.ort} onChange={set("ort")}>{orte.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        </Feld>
        <div className="feld">
          <span className="feld-label">Prüfintervall</span>
          <div className="vorschlaege">
            {INTERVALLE.map(([k, l]) => (
              <button type="button" key={k} className={"vorschlag" + (f.intervall === k ? " aktiv" : "")} onClick={() => setF({ ...f, intervall: k })}>{l}</button>
            ))}
            <span className="eingabe-gruppe" style={{ width: 150 }}>
              <input className="eingabe" style={{ height: 30, paddingLeft: 12, fontSize: 14, borderRadius: 15 }} inputMode="numeric"
                value={intervallEigen ? f.intervall : ""} placeholder="Eigenes" onChange={(e) => setF({ ...f, intervall: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
              <span className="eingabe-suffix" style={{ fontSize: 13 }}>Mon.</span>
            </span>
          </div>
          <span className="feld-hilfe">Für UVV- oder DGUV-Prüfungen. Die App erinnert dich auf der Übersicht, bevor es fällig wird.</span>
        </div>

        {fehler && <div style={{ marginTop: 16 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
        <div className="reihe" style={{ marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" className="knopf geist" onClick={() => router.back()}>Abbrechen</button>
          <button type="submit" className="knopf primaer" disabled={!f.name.trim() || laeuft}><Icon name="haken" groesse={18} />{laeuft ? "Wird gespeichert …" : "Gerät speichern"}</button>
        </div>
      </form>
    </div>
  );
}
