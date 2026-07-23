"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDaten } from "@/components/DatenKontext";
import { Bild } from "@/components/Bild";
import { artFuer } from "@/lib/format";
import { api } from "@/lib/api";

export default function NeuesGeraet() {
  const params = useSearchParams();
  const router = useRouter();
  const { vehicles, istAdmin, neuLaden } = useDaten();
  const vorauswahl = params.get("ort") || "lager";
  const orte = [{ id: "lager", name: "Lager / Betriebshof" }, ...vehicles];

  const [f, setF] = useState({ name: "", kategorie: "", invNr: "", serien: "", ort: vorauswahl, intervall: "" });
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!istAdmin) return <div className="hinweis">Nur Admins dürfen Geräte anlegen.</div>;

  async function speichern() {
    if (!f.name.trim()) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const g = await api.toolAnlegen(f);
      await neuLaden();
      router.push(`/dashboard/orte/${g.ort_id}`);
    } catch (e) {
      setFehler(e.message);
      setLaeuft(false);
    }
  }

  return (
    <div>
      <Link href={`/dashboard/orte/${vorauswahl}`} className="zurueck">← Abbrechen</Link>
      <div className="formular">
        <div className="vorschau"><Bild art={artFuer(f)} groesse={28} /><span>{f.name || "Neues Gerät"}</span></div>
        <label>Bezeichnung</label>
        <input value={f.name} onChange={set("name")} placeholder="z. B. Stihl MS 261 Motorsäge" />
        <label>Kategorie</label>
        <input value={f.kategorie} onChange={set("kategorie")} placeholder="z. B. Motorgeräte" />
        <label>Inventarnummer</label>
        <input value={f.invNr} onChange={set("invNr")} placeholder="z. B. GS-0042" />
        <label>Seriennummer</label>
        <input value={f.serien} onChange={set("serien")} />
        <label>Standort</label>
        <select value={f.ort} onChange={set("ort")}>{orte.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <label>Prüfintervall in Monaten (optional)</label>
        <input inputMode="numeric" value={f.intervall} onChange={(e) => setF({ ...f, intervall: e.target.value.replace(/\D/g, "") })} placeholder="z. B. 12" />
        {fehler && <div className="fehlertext">{fehler}</div>}
        <button className="primaer breit" disabled={!f.name.trim() || laeuft} onClick={speichern}>{laeuft ? "Einen Moment …" : "Gerät speichern"}</button>
      </div>
    </div>
  );
}
