"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDaten } from "@/components/DatenKontext";
import { Bild } from "@/components/Bild";
import { api } from "@/lib/api";

export default function Verwaltung() {
  const { vehicles, istAdmin, neuLaden } = useDaten();
  const [nutzerListe, setNutzerListe] = useState([]);
  const [eigeneId, setEigeneId] = useState(null);

  const [fName, setFName] = useState("");
  const [fKennz, setFKennz] = useState("");
  const [uName, setUName] = useState("");
  const [uBenutzer, setUBenutzer] = useState("");
  const [uCode, setUCode] = useState("");
  const [uRolle, setURolle] = useState("mitarbeiter");
  const [fehler, setFehler] = useState(null);

  async function nutzerLaden() {
    const liste = await api.nutzerListe();
    setNutzerListe(liste);
  }
  useEffect(() => { if (istAdmin) nutzerLaden(); }, [istAdmin]);

  if (!istAdmin) return <div className="hinweis">Nur Admins haben Zugriff auf die Verwaltung.</div>;

  const sauber = uBenutzer.trim().replace(/\s+/g, "").toLowerCase();
  const nameFrei = sauber.length >= 3 && !nutzerListe.some((u) => u.username === sauber);
  const codeOk = uCode.length >= 6;
  const anlegbar = uName.trim() && nameFrei && codeOk;

  async function fahrzeugAnlegen() {
    if (!fName.trim()) return;
    await api.fahrzeugAnlegen(fName.trim(), fKennz.trim());
    await neuLaden();
    setFName(""); setFKennz("");
  }

  async function fahrzeugLoeschen(id) {
    if (!confirm("Fahrzeug wirklich entfernen? Geräte darin wandern ins Lager.")) return;
    await api.fahrzeugLoeschen(id);
    await neuLaden();
  }

  async function nutzerAnlegen() {
    setFehler(null);
    try {
      await api.nutzerAnlegen(uName.trim(), sauber, uCode, uRolle);
      await nutzerLaden();
      setUName(""); setUBenutzer(""); setUCode(""); setURolle("mitarbeiter");
    } catch (e) { setFehler(e.message); }
  }

  async function nutzerLoeschen(id) {
    if (!confirm("Zugang wirklich löschen?")) return;
    try { await api.nutzerLoeschen(id); await nutzerLaden(); } catch (e) { setFehler(e.message); }
  }

  return (
    <div>
      <Link href="/dashboard" className="zurueck">← Übersicht</Link>

      <h3>Fahrzeuge</h3>
      <div className="liste">
        {vehicles.map((v) => (
          <div key={v.id} className="vzeile">
            <span className="vlinks"><Bild thumb={v.thumb} art="transporter" groesse={24} /><span><strong>{v.name}</strong>{v.kennzeichen && <span className="kennz">{v.kennzeichen}</span>}</span></span>
            <button className="minus" onClick={() => fahrzeugLoeschen(v.id)}>entfernen</button>
          </div>
        ))}
        {!vehicles.length && <div className="hinweis">Noch kein Fahrzeug angelegt.</div>}
      </div>
      <div className="formular">
        <label>Neues Fahrzeug</label>
        <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="z. B. Sprinter Kolonne 2" />
        <input value={fKennz} onChange={(e) => setFKennz(e.target.value)} placeholder="Kennzeichen" />
        <button className="primaer breit" disabled={!fName.trim()} onClick={fahrzeugAnlegen}>Fahrzeug anlegen</button>
      </div>

      <h3>Zugänge</h3>
      <div className="liste">
        {nutzerListe.map((u) => (
          <div key={u.id} className="vzeile">
            <span className="ortmitte">
              <strong>{u.name}</strong>
              <span className={"rolle " + u.rolle}>{u.rolle === "admin" ? "Admin" : "Mitarbeiter"}</span>
              <span className="zugangszeile">
                <span className="mono">{u.username}</span>
                <span className="mono leise">······</span>
              </span>
            </span>
            <button className="minus" onClick={() => nutzerLoeschen(u.id)}>löschen</button>
          </div>
        ))}
      </div>
      <p className="fusshinweis">Codes werden verschlüsselt gespeichert und können aus Sicherheitsgründen nirgends angezeigt werden – auch hier nicht. Vergibt jemand seinen Code neu, lege den Zugang neu an.</p>

      <div className="formular">
        <label>Neuer Zugang</label>
        <input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Name des Mitarbeiters" />
        <label>Benutzername</label>
        <input value={uBenutzer} onChange={(e) => setUBenutzer(e.target.value)} placeholder="z. B. m.keller" autoCapitalize="none" autoCorrect="off" />
        {uBenutzer && sauber.length < 3 && <div className="fehlertext">Mindestens 3 Zeichen, ohne Leerzeichen.</div>}
        {sauber.length >= 3 && !nameFrei && <div className="fehlertext">Benutzername ist schon vergeben.</div>}
        <label>Zugangscode (mindestens 6 Ziffern)</label>
        <input className="codefeld" inputMode="numeric" value={uCode} onChange={(e) => setUCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="123456" />
        {uCode && !codeOk && <div className="fehlertext">Der Code braucht mindestens 6 Ziffern.</div>}
        <label>Rolle</label>
        <select value={uRolle} onChange={(e) => setURolle(e.target.value)}>
          <option value="mitarbeiter">Mitarbeiter – umbuchen und Schaden melden</option>
          <option value="admin">Admin – darf alles</option>
        </select>
        {fehler && <div className="fehlertext">{fehler}</div>}
        <button className="primaer breit" disabled={!anlegbar} onClick={nutzerAnlegen}>Zugang anlegen</button>
      </div>
    </div>
  );
}
