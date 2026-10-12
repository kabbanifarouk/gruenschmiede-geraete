"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Feld, Hinweis, Laden } from "@/components/ui";

const nurZiffern = (v) => v.replace(/\D/g, "").slice(0, 8);
const sauberName = (v) => v.trim().replace(/\s+/g, "").toLowerCase();

async function senden(url, body) {
  let r;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (e) {
    return { ok: false, d: { fehler: "Keine Verbindung. Bitte Netz prüfen und erneut versuchen." } };
  }
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

export default function LoginSeite() {
  const [status, setStatus] = useState("pruefe"); // pruefe | einrichten | anmelden | vergessen
  useEffect(() => {
    fetch("/api/setup/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStatus(d.eingerichtet ? "anmelden" : "einrichten"))
      .catch(() => setStatus("anmelden"));
  }, []);

  return (
    <div className="tor">
      <section className="tor-bild" aria-hidden="true">
        <div className="marke">
          <img src="/logo.png" alt="" />
          <span className="marke-text"><span className="marke-name">Grünschmiede</span><span className="marke-sub">Greenteam</span></span>
        </div>
        <div className="tor-claim">
          <h2>Jedes Gerät am richtigen Platz. Jeder Sack gezählt.</h2>
          <p>Geräte, Fahrzeuge und Lagerbestand des Betriebs an einem Ort – im Büro und auf der Baustelle.</p>
        </div>
        <div className="tor-punkte">
          <span><Icon name="werkzeug" groesse={18} />Geräte & Prüffristen</span>
          <span><Icon name="lager" groesse={18} />Lagerbestand</span>
          <span><Icon name="transporter" groesse={18} />Fahrzeuge</span>
        </div>
      </section>
      <section className="tor-form">
        <div className="tor-karte">
          <div className="tor-mobilmarke">
            <img src="/logo.png" alt="" /><span className="marke-name">Grünschmiede</span>
          </div>
          {status === "pruefe" && <Laden />}
          {status === "anmelden" && <Anmeldung onVergessen={() => setStatus("vergessen")} />}
          {status === "vergessen" && <Vergessen onZurueck={() => setStatus("anmelden")} />}
          {status === "einrichten" && <Einrichtung />}
        </div>
      </section>
    </div>
  );
}

function CodeEingabe({ wert, setzen, falsch, gesperrt, onEnter, autoFocus, platzhalter = "6–8 Ziffern" }) {
  return (
    <>
      <div className="codefeld-wrap nur-desktop">
        <input
          className={"eingabe" + (falsch ? " fehlerhaft" : "")} type="password" inputMode="numeric" autoComplete="current-password"
          value={wert} onChange={(e) => setzen(nurZiffern(e.target.value))} placeholder={platzhalter}
          disabled={gesperrt} autoFocus={autoFocus} onKeyDown={(e) => { if (e.key === "Enter") onEnter && onEnter(); }}
        />
      </div>
      <div className="nur-mobil">
        <div className={"code-punkte" + (falsch ? " falsch" : "")} aria-label={`${wert.length} Ziffern eingegeben`}>
          {Array.from({ length: Math.max(6, Math.min(8, wert.length + 1)) }).map((_, i) => <span key={i} className={wert[i] ? "voll" : ""} />)}
        </div>
        <div className="tastenfeld">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((z) => (
            <button key={z} type="button" onClick={() => setzen(nurZiffern(wert + z))} disabled={gesperrt}>{z}</button>
          ))}
          <button type="button" className="leise-taste" onClick={() => setzen("")} disabled={gesperrt || !wert} aria-label="Alles löschen"><Icon name="schliessen" groesse={20} /></button>
          <button type="button" onClick={() => setzen(nurZiffern(wert + "0"))} disabled={gesperrt}>0</button>
          <button type="button" className="leise-taste" onClick={() => setzen(wert.slice(0, -1))} disabled={gesperrt || !wert} aria-label="Letzte Ziffer löschen"><Icon name="zurueck" groesse={22} /></button>
        </div>
      </div>
    </>
  );
}

function Anmeldung({ onVergessen }) {
  const router = useRouter();
  const [benutzer, setBenutzer] = useState("");
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState(null);
  const [sperre, setSperre] = useState(0);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    if (sperre <= 0) return undefined;
    const t = setTimeout(() => setSperre((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sperre]);

  const bereit = sauberName(benutzer).length >= 3 && code.length >= 4 && sperre === 0 && !laeuft;

  async function anmelden(e) {
    e && e.preventDefault();
    if (!bereit) return;
    setLaeuft(true);
    setFehler(null);
    const { ok, d } = await senden("/api/login", { username: benutzer.trim(), code });
    if (!ok) {
      setFehler(d.fehler || "Anmeldung fehlgeschlagen.");
      setCode("");
      if (d.gesperrt) setSperre(d.gesperrt);
      setLaeuft(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={anmelden} noValidate>
      <h1 className="titel-l">Anmelden</h1>
      <p className="leise">Mit deinem Benutzernamen und Zugangscode.</p>

      <div className="stapel">
        <Feld label="Benutzername">
          <input
            className="eingabe" value={benutzer} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            onChange={(e) => { setBenutzer(e.target.value); setFehler(null); }} placeholder="z. B. farouk" disabled={sperre > 0}
          />
        </Feld>
        <div className="feld">
          <span className="feld-label">Zugangscode</span>
          <CodeEingabe wert={code} setzen={(v) => { setCode(v); setFehler(null); }} falsch={!!fehler} gesperrt={sperre > 0} onEnter={anmelden} />
        </div>
        {fehler && <Hinweis art="fehler">{sperre > 0 ? `Zu viele Fehlversuche. Bitte ${sperre} Sekunden warten.` : fehler}</Hinweis>}
        <button className="knopf primaer gross breit" type="submit" disabled={!bereit}>{laeuft ? "Wird angemeldet …" : "Anmelden"}</button>
      </div>
      <div className="tor-fuss">
        <button type="button" className="textlink" onClick={onVergessen}>Code vergessen?</button>
      </div>
    </form>
  );
}

function Vergessen({ onZurueck }) {
  const router = useRouter();
  const [weg, setWeg] = useState(null); // null | schluessel
  const [benutzer, setBenutzer] = useState("");
  const [schluessel, setSchluessel] = useState("");
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  const gleich = code2.length > 0 && code === code2;
  const bereit = sauberName(benutzer).length >= 3 && schluessel.trim() && code.length >= 6 && gleich && !laeuft;

  async function zuruecksetzen(e) {
    e.preventDefault();
    if (!bereit) return;
    setLaeuft(true);
    setFehler(null);
    const { ok, d } = await senden("/api/passwort/vergessen", { username: benutzer.trim(), schluessel, code });
    if (!ok) { setFehler(d.fehler || "Zurücksetzen fehlgeschlagen."); setLaeuft(false); return; }
    router.replace("/dashboard");
    router.refresh();
  }

  if (!weg) {
    return (
      <div>
        <button type="button" className="zurueck" onClick={onZurueck} style={{ background: "none", border: 0 }}><Icon name="zurueck" groesse={18} />Zur Anmeldung</button>
        <h1 className="titel-l">Code vergessen?</h1>
        <p className="leise">Kein Problem. Wähle aus, wer du bist.</p>
        <div className="karte liste-zeilen">
          <div className="zeile">
            <span className="kachel"><Icon name="nutzer" /></span>
            <div className="zeile-mitte">
              <span className="zeile-titel">Ich bin Mitarbeiter</span>
              <span className="zeile-sub" style={{ whiteSpace: "normal" }}>Dein Admin vergibt dir in der Verwaltung unter „Team“ einen neuen Code. Sag ihm einfach Bescheid.</span>
            </div>
          </div>
          <button type="button" className="zeile" onClick={() => setWeg("schluessel")}>
            <span className="kachel"><Icon name="schluessel" /></span>
            <span className="zeile-mitte">
              <span className="zeile-titel">Ich bin Admin</span>
              <span className="zeile-sub">Mit dem Wiederherstellungsschlüssel selbst zurücksetzen</span>
            </span>
            <Icon name="weiter" className="chevron" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={zuruecksetzen} noValidate>
      <button type="button" className="zurueck" onClick={() => setWeg(null)} style={{ background: "none", border: 0 }}><Icon name="zurueck" groesse={18} />Zurück</button>
      <h1 className="titel-l">Neuen Code festlegen</h1>
      <p className="leise">Du brauchst den Wiederherstellungsschlüssel. Er steht in Vercel bei deinem Projekt unter Settings → Environment Variables als <strong>SETUP_SECRET</strong>.</p>
      <div className="stapel">
        <Feld label="Benutzername">
          <input className="eingabe" value={benutzer} onChange={(e) => setBenutzer(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="z. B. farouk" />
        </Feld>
        <Feld label="Wiederherstellungsschlüssel">
          <input className="eingabe" type="password" value={schluessel} onChange={(e) => setSchluessel(e.target.value)} autoComplete="off" />
        </Feld>
        <Feld label="Neuer Code" hilfe="6 bis 8 Ziffern">
          <input className="eingabe" type="password" inputMode="numeric" autoComplete="new-password" value={code} onChange={(e) => setCode(nurZiffern(e.target.value))} />
        </Feld>
        <Feld label="Neuen Code wiederholen" fehler={code2 && !gleich ? "Die Codes stimmen nicht überein." : null}>
          <input className={"eingabe" + (code2 && !gleich ? " fehlerhaft" : "")} type="password" inputMode="numeric" autoComplete="new-password" value={code2} onChange={(e) => setCode2(nurZiffern(e.target.value))} />
        </Feld>
        {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
        <button className="knopf primaer gross breit" type="submit" disabled={!bereit}>{laeuft ? "Einen Moment …" : "Code speichern und anmelden"}</button>
      </div>
    </form>
  );
}

function Einrichtung() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [benutzer, setBenutzer] = useState("");
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  const gleich = code2.length > 0 && code === code2;
  const bereit = name.trim() && sauberName(benutzer).length >= 3 && code.length >= 6 && gleich && setupKey.trim() && !laeuft;

  async function absenden(e) {
    e.preventDefault();
    if (!bereit) return;
    setLaeuft(true);
    setFehler(null);
    const { ok, d } = await senden("/api/setup", { name: name.trim(), username: sauberName(benutzer), code, setupKey: setupKey.trim() });
    if (!ok) { setFehler(d.fehler || "Konnte nicht angelegt werden."); setLaeuft(false); return; }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={absenden} noValidate>
      <h1 className="titel-l">Betrieb einrichten</h1>
      <p className="leise">Lege den ersten Admin-Zugang an. Damit verwaltest du danach Geräte, Lager und dein Team.</p>
      <div className="stapel">
        <Feld label="Dein Name"><input className="eingabe" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Farouk Kabbani" /></Feld>
        <Feld label="Benutzername" hilfe="Mindestens 3 Zeichen, ohne Leerzeichen">
          <input className="eingabe" value={benutzer} onChange={(e) => setBenutzer(e.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="z. B. farouk" />
        </Feld>
        <Feld label="Zugangscode" hilfe="6 bis 8 Ziffern">
          <input className="eingabe" type="password" inputMode="numeric" value={code} onChange={(e) => setCode(nurZiffern(e.target.value))} />
        </Feld>
        <Feld label="Code wiederholen" fehler={code2 && !gleich ? "Die Codes stimmen nicht überein." : null}>
          <input className="eingabe" type="password" inputMode="numeric" value={code2} onChange={(e) => setCode2(nurZiffern(e.target.value))} />
        </Feld>
        <Feld label="Setup-Passwort" hilfe="Steht in Vercel unter Environment Variables als SETUP_SECRET.">
          <input className="eingabe" type="password" value={setupKey} onChange={(e) => setSetupKey(e.target.value)} />
        </Feld>
        {fehler && <Hinweis art="fehler">{fehler}</Hinweis>}
        <button className="knopf primaer gross breit" type="submit" disabled={!bereit}>{laeuft ? "Einen Moment …" : "Betrieb einrichten"}</button>
      </div>
    </form>
  );
}
