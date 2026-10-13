"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { InstallAbschnitt } from "@/components/Pwa";
import { Feld, Hinweis, Seitenkopf } from "@/components/ui";
import { initialen } from "@/lib/format";
import { api } from "@/lib/api";

const nurZiffern = (v) => v.replace(/\D/g, "").slice(0, 8);

export default function Konto() {
  const router = useRouter();
  const { nutzer, istAdmin, melde } = useDaten();
  const [alt, setAlt] = useState("");
  const [neu, setNeu] = useState("");
  const [neu2, setNeu2] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);

  const gleich = neu2.length > 0 && neu === neu2;
  const bereit = alt.length >= 4 && neu.length >= 6 && gleich && !laeuft;

  async function codeAendern(e) {
    e.preventDefault();
    if (!bereit) return;
    setLaeuft(true);
    setFehler(null);
    try {
      await api.eigenenCodeAendern(alt, neu);
      melde("Code geändert");
      setAlt(""); setNeu(""); setNeu2("");
    } catch (err) { setFehler(err.message); }
    setLaeuft(false);
  }

  async function abmelden() {
    try { await api.abmelden(); } catch (e) { /* trotzdem weiter */ }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Seitenkopf titel="Mein Konto" />

      <div className="karte karte-innen reihe" style={{ gap: 14 }}>
        <span className="avatar" style={{ width: 52, height: 52, fontSize: 19 }}>{initialen(nutzer.name)}</span>
        <div className="zeile-mitte">
          <span className="titel-m">{nutzer.name}</span>
          <span className="leise">@{nutzer.username}, {istAdmin ? "Admin" : "Mitarbeiter"}</span>
        </div>
      </div>

      <section className="abschnitt">
        <h2 className="titel-m" style={{ marginBottom: 12 }}>Zugangscode ändern</h2>
        <form className="karte karte-innen" onSubmit={codeAendern} noValidate>
          <Feld label="Aktueller Code">
            <input className="eingabe" type="password" inputMode="numeric" autoComplete="current-password" value={alt} onChange={(e) => setAlt(nurZiffern(e.target.value))} />
          </Feld>
          <div className="feldreihe">
            <Feld label="Neuer Code" hilfe="6 bis 8 Ziffern">
              <input className="eingabe" type="password" inputMode="numeric" autoComplete="new-password" value={neu} onChange={(e) => setNeu(nurZiffern(e.target.value))} />
            </Feld>
            <Feld label="Wiederholen" fehler={neu2 && !gleich ? "Stimmt nicht überein" : null}>
              <input className="eingabe" type="password" inputMode="numeric" autoComplete="new-password" value={neu2} onChange={(e) => setNeu2(nurZiffern(e.target.value))} />
            </Feld>
          </div>
          {fehler && <div style={{ marginTop: 14 }}><Hinweis art="fehler">{fehler}</Hinweis></div>}
          <div className="reihe" style={{ marginTop: 18, justifyContent: "flex-end" }}>
            <button type="submit" className="knopf primaer" disabled={!bereit}>{laeuft ? "Wird gespeichert …" : "Code ändern"}</button>
          </div>
        </form>
        <p className="feld-hilfe" style={{ marginTop: 10 }}>
          {istAdmin
            ? "Aktuellen Code vergessen? Melde dich ab und nutze auf der Anmeldeseite „Code vergessen?“ mit dem Wiederherstellungsschlüssel."
            : "Aktuellen Code vergessen? Dein Admin kann dir in der Verwaltung einen neuen vergeben."}
        </p>
      </section>

      <section className="abschnitt">
        <h2 className="titel-m" style={{ marginBottom: 12 }}>App auf dem Handy</h2>
        <InstallAbschnitt />
      </section>

      <section className="abschnitt">
        <button className="knopf sekundaer breit gross" onClick={abmelden}><Icon name="abmelden" groesse={18} />Abmelden</button>
      </section>
    </div>
  );
}
