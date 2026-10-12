"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import AuftragFormular, { leererAuftrag } from "@/components/AuftragFormular";
import { useDaten } from "@/components/DatenKontext";
import { Hinweis, Leer, Seitenkopf } from "@/components/ui";
import { api } from "@/lib/api";

export default function NeuerAuftrag() {
  const router = useRouter();
  const { auftraege, istAdmin, neuLaden, melde } = useDaten();
  const [f, setF] = useState(leererAuftrag());
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  if (!istAdmin) return <div className="karte"><Leer icon="schloss" titel="Nur für Admins" text="Neue Aufträge kann nur ein Admin anlegen." /></div>;

  async function speichern(e) {
    e.preventDefault();
    if (!f.titel.trim() || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const a = await api.auftragAnlegen(f);
      await neuLaden();
      melde("Auftrag angelegt");
      router.replace(`/dashboard/auftraege/${a.id}`);
    } catch (err) { setFehler(err.message); setLaeuft(false); }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <Seitenkopf zurueck={{ href: "/dashboard/auftraege", text: "Aufträge" }} titel="Auftrag anlegen" />
      <form className="karte karte-innen" onSubmit={speichern} noValidate>
        <AuftragFormular f={f} setF={setF} auftraege={auftraege} mitStatus />
        {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
        <div className="reihe" style={{ marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" className="knopf geist" onClick={() => router.back()}>Abbrechen</button>
          <button type="submit" className="knopf primaer" disabled={!f.titel.trim() || laeuft}><Icon name="haken" groesse={18} />{laeuft ? "Wird gespeichert …" : "Auftrag speichern"}</button>
        </div>
      </form>
    </div>
  );
}
