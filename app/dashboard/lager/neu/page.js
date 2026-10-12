"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import MaterialFormular, { leeresMaterial } from "@/components/MaterialFormular";
import { useDaten } from "@/components/DatenKontext";
import { Hinweis, Leer, Seitenkopf } from "@/components/ui";
import { api } from "@/lib/api";

export default function NeuesMaterial() {
  const router = useRouter();
  const { materials, istAdmin, neuLaden, melde } = useDaten();
  const [f, setF] = useState(leeresMaterial());
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  if (!istAdmin) return <div className="karte"><Leer icon="schloss" titel="Nur für Admins" text="Neues Material kann nur ein Admin anlegen." /></div>;

  const doppelt = f.name.trim() && materials.some((m) => m.name.trim().toLowerCase() === f.name.trim().toLowerCase());

  async function speichern(e) {
    e.preventDefault();
    if (!f.name.trim() || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const m = await api.materialAnlegen(f);
      await neuLaden();
      melde("Material angelegt");
      router.replace(`/dashboard/lager/${m.id}`);
    } catch (err) {
      setFehler(err.message);
      setLaeuft(false);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <Seitenkopf zurueck={{ href: "/dashboard/lager", text: "Lager" }} titel="Material anlegen" />
      <form className="karte karte-innen" onSubmit={speichern} noValidate>
        <MaterialFormular f={f} setF={setF} mitBestand materials={materials} />
        {doppelt && <div style={{ marginTop: 14 }}><Hinweis art="warn">Ein Material mit diesem Namen gibt es schon. Für Nachschub dort einfach einen Zugang buchen.</Hinweis></div>}
        {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
        <div className="reihe" style={{ marginTop: 22, justifyContent: "flex-end" }}>
          <button type="button" className="knopf geist" onClick={() => router.back()}>Abbrechen</button>
          <button type="submit" className="knopf primaer" disabled={!f.name.trim() || laeuft}><Icon name="haken" groesse={18} />{laeuft ? "Wird gespeichert …" : "Material speichern"}</button>
        </div>
      </form>
    </div>
  );
}
