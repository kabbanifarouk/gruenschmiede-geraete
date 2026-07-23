"use client";
import Kopf from "./Kopf";
import Leiste from "./Leiste";
import { DatenProvider, useDaten } from "./DatenKontext";

function Toast() {
  const { meldung } = useDaten();
  if (!meldung) return null;
  return <div className="toast">{meldung}</div>;
}

export default function DashboardShell({ nutzer, children }) {
  return (
    <div className="app">
      <Kopf nutzer={nutzer} />
      <DatenProvider nutzer={nutzer}>
        <div className="inhalt">
          <Toast />
          <main>{children}</main>
          <footer className="fuss">Grünschmiede Greenteam · Gerätebestand</footer>
        </div>
        <Leiste istAdmin={nutzer.rolle === "admin"} />
      </DatenProvider>
    </div>
  );
}
