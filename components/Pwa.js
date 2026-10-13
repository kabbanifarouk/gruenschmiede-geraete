"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

// Chrome auf Android bietet die Installation über ein Ereignis an, das sehr
// früh kommt. Es wird hier abgefangen und für den Installieren-Knopf aufgehoben.
function istStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function geraet() {
  if (typeof navigator === "undefined") return "andere";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return /SamsungBrowser/i.test(ua) ? "samsung" : "android";
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "andere";
}

// In das Root-Layout eingebunden: Service Worker anmelden, Installations-Angebot merken
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* ohne Service Worker läuft die App trotzdem */ });
    }
    const merken = (e) => {
      e.preventDefault();
      window.__gsInstall = e;
      window.dispatchEvent(new Event("gs-installierbar"));
    };
    const installiert = () => {
      window.__gsInstall = null;
      window.dispatchEvent(new Event("gs-installierbar"));
    };
    window.addEventListener("beforeinstallprompt", merken);
    window.addEventListener("appinstalled", installiert);
    return () => {
      window.removeEventListener("beforeinstallprompt", merken);
      window.removeEventListener("appinstalled", installiert);
    };
  }, []);
  return null;
}

export function useInstallation() {
  const [angebot, setAngebot] = useState(null);
  const [standalone, setStandalone] = useState(false);
  const [art, setArt] = useState("andere");
  useEffect(() => {
    setStandalone(istStandalone());
    setArt(geraet());
    const lesen = () => setAngebot(window.__gsInstall || null);
    lesen();
    window.addEventListener("gs-installierbar", lesen);
    return () => window.removeEventListener("gs-installierbar", lesen);
  }, []);
  async function installieren() {
    if (!angebot) return false;
    angebot.prompt();
    const { outcome } = await angebot.userChoice.catch(() => ({ outcome: "dismissed" }));
    window.__gsInstall = null;
    setAngebot(null);
    return outcome === "accepted";
  }
  return { angebot, standalone, art, installieren };
}

const SCHLUESSEL = "gs-install-spaeter";

// Hinweis-Karte oben in der App, nur auf Android im Browser, wenn Chrome die Installation anbietet
export function InstallHinweis() {
  const { angebot, standalone, installieren } = useInstallation();
  const [ausgeblendet, setAusgeblendet] = useState(true);
  useEffect(() => {
    try {
      const bis = Number(localStorage.getItem(SCHLUESSEL) || 0);
      setAusgeblendet(Date.now() < bis);
    } catch (e) { setAusgeblendet(false); }
  }, []);
  if (standalone || !angebot || ausgeblendet) return null;
  function spaeter() {
    try { localStorage.setItem(SCHLUESSEL, String(Date.now() + 14 * 86400000)); } catch (e) { /* egal */ }
    setAusgeblendet(true);
  }
  return (
    <div className="install-karte" role="region" aria-label="App installieren">
      <img src="/icon-192.png" alt="" width="44" height="44" />
      <div className="zeile-mitte">
        <span className="stark">Als App installieren</span>
        <span className="leise klein">Eigenes Symbol, ohne Browserleiste</span>
      </div>
      <button className="knopf primaer klein" onClick={installieren}>Installieren</button>
      <button className="knopf geist rund klein" onClick={spaeter} aria-label="Später"><Icon name="schliessen" groesse={16} /></button>
    </div>
  );
}

// Abschnitt für „Mein Konto“: Status und Anleitung je nach Handy
export function InstallAbschnitt() {
  const { angebot, standalone, art, installieren } = useInstallation();
  if (standalone) {
    return <div className="hinweisbox ok"><Icon name="haken" groesse={18} /><div>Die App ist auf diesem Gerät installiert.</div></div>;
  }
  return (
    <div className="karte karte-innen stapel">
      {angebot && (
        <button className="knopf primaer gross breit" onClick={installieren}><Icon name="plus" groesse={18} />Jetzt als App installieren</button>
      )}
      {(art === "android" || art === "andere") && !angebot && (
        <ol className="anleitung">
          <li>Diese Seite in <strong>Chrome</strong> öffnen.</li>
          <li>Oben rechts auf <strong>⋮</strong> tippen.</li>
          <li><strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong> wählen und dann <strong>„Installieren“</strong> bestätigen.</li>
        </ol>
      )}
      {art === "samsung" && !angebot && (
        <ol className="anleitung">
          <li>Unten auf das Menü <strong>☰</strong> tippen.</li>
          <li><strong>„Seite hinzufügen zu“</strong> und dann <strong>„Startbildschirm“</strong> wählen.</li>
          <li>Noch besser läuft die App, wenn du sie in <strong>Chrome</strong> installierst.</li>
        </ol>
      )}
      {art === "ios" && (
        <ol className="anleitung">
          <li>Diese Seite in <strong>Safari</strong> öffnen.</li>
          <li>Unten auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil).</li>
          <li><strong>„Zum Home-Bildschirm“</strong> wählen und <strong>„Hinzufügen“</strong> tippen.</li>
        </ol>
      )}
      <p className="feld-hilfe">Danach öffnest du die App über das Grünschmiede-Symbol auf dem Startbildschirm, ganz ohne Browserleiste.</p>
    </div>
  );
}
