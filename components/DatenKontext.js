"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const Ctx = createContext(null);

export function DatenProvider({ nutzer, children }) {
  const [vehicles, setVehicles] = useState([]);
  const [tools, setTools] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [auftraege, setAuftraege] = useState([]);
  const [laufend, setLaufend] = useState([]);
  const [zeitVersatz, setZeitVersatz] = useState(0); // Server-Uhr minus Geräte-Uhr
  const [laden, setLaden] = useState(true);
  const [toasts, setToasts] = useState([]);
  const zaehler = useRef(0);

  const neuLaden = useCallback(async () => {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/login"; return; }
      if (!r.ok) return;
      const d = await r.json();
      setVehicles(d.vehicles || []);
      setTools(d.tools || []);
      setMaterials(d.materials || []);
      setAuftraege(d.auftraege || []);
      setLaufend(d.laufend || []);
      if (d.jetzt) setZeitVersatz(new Date(d.jetzt).getTime() - Date.now());
    } catch (e) { /* nächster Versuch folgt automatisch */ }
    setLaden(false);
  }, []);

  useEffect(() => {
    neuLaden();
    const t = setInterval(() => { if (document.visibilityState === "visible") neuLaden(); }, 20000);
    const sicht = () => { if (document.visibilityState === "visible") neuLaden(); };
    document.addEventListener("visibilitychange", sicht);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", sicht); };
  }, [neuLaden]);

  const melde = useCallback((text, typ = "ok") => {
    const id = ++zaehler.current;
    setToasts((l) => [...l, { id, text, typ }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <Ctx.Provider value={{ vehicles, tools, materials, auftraege, laufend, zeitVersatz, laden, neuLaden, melde, toasts, nutzer, istAdmin: nutzer.rolle === "admin" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDaten() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDaten() muss innerhalb von DatenProvider verwendet werden");
  return c;
}
