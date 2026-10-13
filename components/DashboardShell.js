"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { DatenProvider, useDaten } from "./DatenKontext";
import { TimerLeiste } from "./Zeiterfassung";
import { InstallHinweis } from "./Pwa";
import { bestandsLage, initialen } from "@/lib/format";

function Toasts() {
  const { toasts } = useDaten();
  return (
    <div className="toast-bereich" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + t.typ}>
          <Icon name={t.typ === "fehler" ? "warnung" : "haken"} groesse={18} />{t.text}
        </div>
      ))}
    </div>
  );
}

function useNavigation() {
  const pfad = usePathname();
  const { tools, materials, istAdmin } = useDaten();
  const auffaellig = tools.filter((t) => (t.status || "ok") !== "ok").length;
  const knapp = materials.filter((m) => bestandsLage(m) !== "ok").length;
  const aktiv = (href) => {
    if (href === "/dashboard") return pfad === "/dashboard" || pfad.startsWith("/dashboard/orte");
    return pfad.startsWith(href);
  };
  const punkte = [
    { href: "/dashboard", text: "Übersicht", icon: "home" },
    { href: "/dashboard/auftraege", text: "Aufträge", icon: "baustelle" },
    { href: "/dashboard/geraete", text: "Geräte", icon: "werkzeug", zahl: auffaellig },
    { href: "/dashboard/lager", text: "Lager", icon: "lager", zahl: knapp },
  ];
  if (istAdmin) punkte.push({ href: "/dashboard/verwaltung", text: "Verwaltung", kurz: "Admin", icon: "team" });
  return { punkte, aktiv };
}

function Seitenleiste({ nutzer }) {
  const { punkte, aktiv } = useNavigation();
  return (
    <aside className="seitenleiste">
      <Link href="/dashboard" className="marke">
        <img src="/logo.png" alt="" />
        <span className="marke-text"><span className="marke-name">Grünschmiede</span><span className="marke-sub">Betriebsbestand</span></span>
      </Link>
      <nav className="nav" aria-label="Hauptnavigation">
        {punkte.map((p) => (
          <Link key={p.href} href={p.href} className={"nav-link" + (aktiv(p.href) ? " aktiv" : "")}>
            <Icon name={p.icon} />{p.text}
            {p.zahl > 0 && <span className="nav-zahl" title="Braucht Aufmerksamkeit">{p.zahl}</span>}
          </Link>
        ))}
      </nav>
      <Link href="/dashboard/konto" className="nutzerfeld">
        <span className="avatar">{initialen(nutzer.name)}</span>
        <span className="nutzer-text">
          <span className="nutzer-name">{nutzer.name}</span>
          <span className="nutzer-rolle">{nutzer.rolle === "admin" ? "Admin" : "Mitarbeiter"}</span>
        </span>
        <Icon name="einstellungen" groesse={18} className="sehr-leise" />
      </Link>
    </aside>
  );
}

function MobilKopf({ nutzer }) {
  return (
    <header className="mobilkopf">
      <Link href="/dashboard" className="marke">
        <img src="/logo.png" alt="" />
        <span className="marke-name">Grünschmiede</span>
      </Link>
      <Link href="/dashboard/konto" aria-label="Mein Konto"><span className="avatar hell">{initialen(nutzer.name)}</span></Link>
    </header>
  );
}

function Tabbar() {
  const { punkte, aktiv } = useNavigation();
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {punkte.map((p) => (
        <Link key={p.href} href={p.href} className={"tab" + (aktiv(p.href) ? " aktiv" : "")}>
          <Icon name={p.icon} groesse={22} />
          {p.zahl > 0 && <span className="punkt-zahl">{p.zahl}</span>}
          <span>{p.kurz || p.text}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function DashboardShell({ nutzer, children }) {
  return (
    <DatenProvider nutzer={nutzer}>
      <div className="rahmen">
        <Seitenleiste nutzer={nutzer} />
        <MobilKopf nutzer={nutzer} />
        <main className="inhalt"><div className="inhalt-innen"><InstallHinweis /><TimerLeiste />{children}</div></main>
        <Tabbar />
        <Toasts />
      </div>
    </DatenProvider>
  );
}
