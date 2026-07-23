"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);

export function DatenProvider({ nutzer, children }) {
  const [vehicles, setVehicles] = useState([]);
  const [tools, setTools] = useState([]);
  const [laden, setLaden] = useState(true);
  const [meldung, setMeldung] = useState(null);

  const laden_ausfuehren = useCallback(async () => {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setVehicles(d.vehicles || []);
      setTools(d.tools || []);
    } catch (e) { /* nächster Versuch folgt automatisch */ }
    setLaden(false);
  }, []);

  useEffect(() => {
    laden_ausfuehren();
    const t = setInterval(laden_ausfuehren, 15000);
    return () => clearInterval(t);
  }, [laden_ausfuehren]);

  function melde(txt) {
    setMeldung(txt);
    setTimeout(() => setMeldung(null), 2400);
  }

  return (
    <Ctx.Provider value={{ vehicles, tools, laden, neuLaden: laden_ausfuehren, melde, meldung, nutzer, istAdmin: nutzer.rolle === "admin" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDaten() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDaten() muss innerhalb von DatenProvider verwendet werden");
  return c;
}
