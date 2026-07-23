"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginSeite() {
  const [pruefeEinrichtung, setPruefeEinrichtung] = useState(true);
  const [eingerichtet, setEingerichtet] = useState(true);

  useEffect(() => {
    fetch("/api/setup/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEingerichtet(!!d.eingerichtet))
      .catch(() => setEingerichtet(true))
      .finally(() => setPruefeEinrichtung(false));
  }, []);

  if (pruefeEinrichtung) return <Rahmen><div className="hinweis">Wird geladen …</div></Rahmen>;
  return <Rahmen>{eingerichtet ? <Anmeldung /> : <Einrichtung />}</Rahmen>;
}

function Rahmen({ children }) {
  return <div className="app">{children}</div>;
}

function Logo({ hoehe = 72 }) {
  return <img className="logo" src="/logo.png" alt="Grünschmiede" style={{ height: hoehe }} />;
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

  const nurZiffern = (v) => v.replace(/\D/g, "").slice(0, 8);
  const sauber = benutzer.trim().replace(/\s+/g, "").toLowerCase();
  const codeOk = code.length >= 6;
  const gleich = code2.length > 0 && code === code2;
  const fertig = name.trim() && sauber.length >= 3 && codeOk && gleich && setupKey.trim();

  async function absenden() {
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: sauber, code, setupKey: setupKey.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setFehler(d.fehler || "Konnte nicht angelegt werden."); setLaeuft(false); return; }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setFehler("Verbindung fehlgeschlagen. Nochmal versuchen.");
      setLaeuft(false);
    }
  }

  return (
    <div className="tor">
      <Logo />
      <div className="wortmarke gross">Grün<span>schmiede</span></div>
      <div className="tagline">Gerätebestand</div>
      <div className="torkarte">
        <h1>Betrieb einrichten</h1>
        <p className="fliess">Lege den ersten Admin-Zugang an. Damit verwaltest du danach Fahrzeuge, Geräte und die Zugänge deiner Leute.</p>

        <label>Dein Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Farouk" />

        <label>Benutzername</label>
        <input value={benutzer} onChange={(e) => setBenutzer(e.target.value)} placeholder="z. B. farouk" autoCapitalize="none" autoCorrect="off" />

        <label>Zugangscode (mindestens 6 Ziffern)</label>
        <input className="codefeld" inputMode="numeric" type="password" value={code} onChange={(e) => setCode(nurZiffern(e.target.value))} placeholder="······" />

        <label>Code wiederholen</label>
        <input className="codefeld" inputMode="numeric" type="password" value={code2} onChange={(e) => setCode2(nurZiffern(e.target.value))} placeholder="······" />
        {code2 && !gleich && <div className="fehlertext">Die beiden Codes sind nicht gleich.</div>}

        <label>Setup-Passwort</label>
        <input type="password" value={setupKey} onChange={(e) => setSetupKey(e.target.value)} placeholder="aus Vercel: SETUP_SECRET" />
        <p className="fusshinweis">Das Setup-Passwort steht in Vercel unter Umgebungsvariablen. Es verhindert, dass jemand anderes vor dir den ersten Zugang anlegt.</p>

        {fehler && <div className="fehlertext">{fehler}</div>}
        <button className="primaer breit" disabled={!fertig || laeuft} onClick={absenden}>{laeuft ? "Einen Moment …" : "Los geht's"}</button>
      </div>
    </div>
  );
}

function Anmeldung() {
  const router = useRouter();
  const [benutzer, setBenutzer] = useState("");
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState(null);
  const [sperre, setSperre] = useState(0);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    if (sperre <= 0) return undefined;
    const t = setTimeout(() => setSperre(sperre - 1), 1000);
    return () => clearTimeout(t);
  }, [sperre]);

  async function pruefen() {
    if (sperre > 0 || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: benutzer.trim(), code }),
      });
      const d = await r.json();
      if (!r.ok) {
        setFehler(d.fehler || "Anmeldung fehlgeschlagen.");
        setCode("");
        if (d.gesperrt) setSperre(d.gesperrt);
        setLaeuft(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setFehler("Verbindung fehlgeschlagen. Nochmal versuchen.");
      setLaeuft(false);
    }
  }

  function tippe(z) {
    if (sperre > 0) return;
    setFehler(null);
    setCode((code + z).slice(0, 8));
  }

  const bereit = benutzer.trim().length >= 3 && code.length >= 4 && sperre === 0 && !laeuft;

  return (
    <div className="tor">
      <Logo />
      <div className="wortmarke gross">Grün<span>schmiede</span></div>
      <div className="tagline">Gerätebestand</div>
      <div className="torkarte">
        <h1>Anmelden</h1>
        <p className="fliess">Benutzername und Code bekommst du vom Chef.</p>

        <label>Benutzername</label>
        <input value={benutzer} onChange={(e) => { setBenutzer(e.target.value); setFehler(null); }}
          placeholder="z. B. farouk" autoCapitalize="none" autoCorrect="off" disabled={sperre > 0}
          onKeyDown={(e) => { if (e.key === "Enter") pruefen(); }} />

        <label>Code</label>
        <div className={"codeanzeige" + (fehler ? " falsch" : "")}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <span key={i} className={"stelle" + (code[i] ? " voll" : "")} />)}
        </div>
        {fehler && <div className="fehlertext">{fehler}</div>}

        <div className="tastatur">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => <button key={z} onClick={() => tippe(String(z))} disabled={sperre > 0}>{z}</button>)}
          <button className="leerknopf" disabled />
          <button onClick={() => tippe("0")} disabled={sperre > 0}>0</button>
          <button onClick={() => setCode(code.slice(0, -1))} disabled={sperre > 0}>←</button>
        </div>
        <button className="primaer breit" disabled={!bereit} onClick={pruefen}>{laeuft ? "Einen Moment …" : "Anmelden"}</button>
      </div>
    </div>
  );
}
