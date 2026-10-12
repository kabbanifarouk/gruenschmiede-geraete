"use client";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useDaten } from "@/components/DatenKontext";
import { Kachel, Laden, Status } from "@/components/ui";
import { Laufzeit } from "@/components/Zeiterfassung";
import {
  LAGER, artFuer, artFuerMaterial, bestandsLage, fristText, initialen, pruefStatus, uhrzeit, zahlText, zeigeDatum,
} from "@/lib/format";

function gruss() {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

export default function Uebersicht() {
  const { vehicles, tools, materials, auftraege, laufend, laden, nutzer, istAdmin } = useDaten();
  if (laden) return <Laden />;

  const vorname = (nutzer.name || "").split(" ")[0];
  const ortName = (id) => (id === "lager" ? LAGER.name : (vehicles.find((v) => v.id === id) || {}).name || "Unbekannt");

  const auffaellig = tools.filter((t) => (t.status || "ok") !== "ok");
  const pruefungen = tools.map((t) => ({ t, p: pruefStatus(t) })).filter((x) => x.p && x.p.tage <= 30);
  const knapp = materials.filter((m) => bestandsLage(m) !== "ok");
  const bereit = tools.length - auffaellig.length;

  // Handlungsbedarf: alles, was jemand anfassen muss – nach Dringlichkeit
  const aufgaben = [];
  auffaellig.forEach((t) => {
    const p = pruefStatus(t);
    const pruefHinweis = p && p.tage <= 30 ? `Prüfung ${fristText(p.tage)}` : null;
    aufgaben.push({
      key: "t" + t.id, rang: t.status === "defekt" ? 0 : t.status === "weg" ? 1 : 3,
      href: `/dashboard/geraete/${t.id}`, kachel: <Kachel thumb={t.thumb} art={artFuer(t)} />,
      titel: t.name, sub: [t.notiz || ortName(t.ort_id), pruefHinweis].filter(Boolean).join(", "), rechts: <Status status={t.status} kurz />,
    });
  });
  pruefungen.filter(({ t }) => (t.status || "ok") === "ok").forEach(({ t, p }) => aufgaben.push({
    key: "p" + t.id, rang: p.tage < 0 ? 2 : 5,
    href: `/dashboard/geraete/${t.id}`, kachel: <Kachel thumb={t.thumb} art={artFuer(t)} />,
    titel: t.name, sub: `Prüfung ${fristText(p.tage)}`,
    rechts: <span className={p.tage < 0 ? "ueberfaellig klein" : "bald klein"}>{zeigeDatum(p.datum)}</span>,
  }));
  vehicles.forEach((v) => {
    const tage = v.faellig ? Math.round((new Date(v.faellig) - new Date()) / 86400000) : null;
    if ((v.status || "ok") !== "ok") {
      aufgaben.push({
        key: "v" + v.id, rang: v.status === "defekt" ? 0 : 3, href: `/dashboard/orte/${v.id}`,
        kachel: <Kachel thumb={v.thumb} art="transporter" />, titel: v.name, sub: v.notiz || "Fahrzeug", rechts: <Status status={v.status} kurz />,
      });
    } else if (tage !== null && tage <= 30) {
      aufgaben.push({
        key: "f" + v.id, rang: tage < 0 ? 2 : 5, href: `/dashboard/orte/${v.id}`,
        kachel: <Kachel thumb={v.thumb} art="transporter" />, titel: v.name, sub: `Termin ${fristText(tage)}`,
        rechts: <span className={tage < 0 ? "ueberfaellig klein" : "bald klein"}>{zeigeDatum(v.faellig)}</span>,
      });
    }
  });
  knapp.forEach((m) => {
    const leer = bestandsLage(m) === "leer";
    aufgaben.push({
      key: "m" + m.id, rang: leer ? 1 : 4, href: `/dashboard/lager/${m.id}`,
      kachel: <Kachel thumb={m.thumb} art={artFuerMaterial(m)} />, titel: m.name,
      sub: leer ? "Nicht mehr auf Lager" : `Unter Mindestbestand (${zahlText(m.mindestbestand)} ${m.einheit})`,
      rechts: <span className={"bestand-zahl " + (leer ? "ist-leer" : "ist-knapp")} style={{ fontSize: 17 }}>{zahlText(m.bestand)}<span className="bestand-einheit">{m.einheit}</span></span>,
    });
  });
  aufgaben.sort((a, b) => a.rang - b.rang);

  const orte = [LAGER, ...vehicles];

  return (
    <div>
      <div className="seitenkopf">
        <div className="seitenkopf-text">
          <h1 className="titel-xl">{gruss()}, {vorname}</h1>
          <p className="leise">{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        {istAdmin && (
          <div className="seitenkopf-aktionen nur-desktop">
            <Link href="/dashboard/geraete/neu" className="knopf sekundaer"><Icon name="werkzeug" groesse={18} />Gerät erfassen</Link>
            <Link href="/dashboard/auftraege/neu" className="knopf primaer"><Icon name="plus" groesse={18} />Auftrag anlegen</Link>
          </div>
        )}
      </div>

      <div className="kennzahlen">
        <Link href="/dashboard/geraete" className="kennzahl">
          <span className="kennzahl-kopf">Geräte<Icon name="werkzeug" groesse={18} /></span>
          <span className="kennzahl-wert">{tools.length}</span>
          <span className="kennzahl-fuss">{bereit} einsatzbereit</span>
        </Link>
        <Link href="/dashboard/geraete?zustand=auffaellig" className={"kennzahl" + (auffaellig.length ? " achtung" : "")}>
          <span className="kennzahl-kopf">Auffällig<Icon name="warnung" groesse={18} /></span>
          <span className="kennzahl-wert">{auffaellig.length}</span>
          <span className="kennzahl-fuss">{auffaellig.length ? "Defekt, Wartung, vermisst" : "Alles in Ordnung"}</span>
        </Link>
        <Link href="/dashboard/geraete?zustand=pruefung" className={"kennzahl" + (pruefungen.some((x) => x.p.tage < 0) ? " achtung" : pruefungen.length ? " warnung" : "")}>
          <span className="kennzahl-kopf">Prüfungen<Icon name="schild" groesse={18} /></span>
          <span className="kennzahl-wert">{pruefungen.length}</span>
          <span className="kennzahl-fuss">in den nächsten 30 Tagen</span>
        </Link>
        <Link href="/dashboard/lager?filter=knapp" className={"kennzahl" + (knapp.length ? " warnung" : "")}>
          <span className="kennzahl-kopf">Material knapp<Icon name="lager" groesse={18} /></span>
          <span className="kennzahl-wert">{knapp.length}</span>
          <span className="kennzahl-fuss">von {materials.length} Artikeln</span>
        </Link>
      </div>

      {laufend.length > 0 && (
        <section className="abschnitt">
          <div className="abschnitt-kopf">
            <h2 className="titel-m reihe" style={{ gap: 10 }}><span className="live-punkt" />Gerade im Einsatz</h2>
            <Link href="/dashboard/auftraege" className="textlink klein">Alle Aufträge</Link>
          </div>
          <div className="karte liste-zeilen">
            {laufend.map((z) => {
              const a = auftraege.find((x) => x.id === z.auftrag_id);
              return (
                <Link key={z.id} href={`/dashboard/auftraege/${z.auftrag_id}`} className="zeile">
                  <span className="avatar hell">{initialen(z.wer)}</span>
                  <span className="zeile-mitte">
                    <span className="zeile-titel">{z.wer}</span>
                    <span className="zeile-sub"><span><Icon name="baustelle" groesse={14} />{a?.titel || "Auftrag"}</span><span className="nur-desktop">seit {uhrzeit(z.start)} Uhr</span></span>
                  </span>
                  <span className="zeile-rechts"><Laufzeit start={z.start} className="einsatz-uhr" /><Icon name="weiter" groesse={18} className="chevron" /></span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="abschnitt">
        <div className="abschnitt-kopf">
          <h2 className="titel-m">Handlungsbedarf</h2>
          {aufgaben.length > 0 && <span className="leise klein">{aufgaben.length} {aufgaben.length === 1 ? "Punkt" : "Punkte"}</span>}
        </div>
        <div className="karte">
          {aufgaben.length === 0 ? (
            <div className="leer" style={{ padding: "32px 24px" }}>
              <span className="leer-symbol" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}><Icon name="haken" groesse={26} /></span>
              <h3 className="titel-m">Alles im grünen Bereich</h3>
              <p>Keine defekten Geräte, keine fälligen Prüfungen, genug Material auf Lager.</p>
            </div>
          ) : (
            <div className="liste-zeilen">
              {aufgaben.slice(0, 8).map((a) => (
                <Link key={a.key} href={a.href} className="zeile">
                  {a.kachel}
                  <span className="zeile-mitte">
                    <span className="zeile-titel">{a.titel}</span>
                    <span className="zeile-sub"><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{a.sub}</span></span>
                  </span>
                  <span className="zeile-rechts">{a.rechts}<Icon name="weiter" groesse={18} className="chevron" /></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="abschnitt">
        <div className="abschnitt-kopf">
          <h2 className="titel-m">Standorte</h2>
          {istAdmin && <Link href="/dashboard/verwaltung" className="textlink klein">Fahrzeuge verwalten</Link>}
        </div>
        <div className="standorte">
          {orte.map((o) => {
            const drin = tools.filter((t) => t.ort_id === o.id);
            const auf = drin.filter((t) => (t.status || "ok") !== "ok").length;
            const istFahrzeug = o.id !== "lager";
            return (
              <Link key={o.id} href={`/dashboard/orte/${o.id}`} className="standort">
                <div className="standort-kopf">
                  <Kachel thumb={o.thumb} art={istFahrzeug ? "transporter" : "halle"} />
                  <div className="zeile-mitte">
                    <span className="zeile-titel">{o.name}</span>
                    <span className="zeile-sub">
                      {o.kennzeichen ? <span className="kennzeichen">{o.kennzeichen}</span> : <span>{istFahrzeug ? "Fahrzeug" : "Hauptstandort"}</span>}
                    </span>
                  </div>
                  {istFahrzeug && (o.status || "ok") !== "ok" && <Status status={o.status} kurz />}
                </div>
                <div className="standort-zahlen">
                  <div><strong>{drin.length}</strong><span>Geräte</span></div>
                  <div><strong style={{ color: auf ? "var(--rot)" : undefined }}>{auf}</strong><span>auffällig</span></div>
                  {o.id === "lager" && <div><strong>{materials.length}</strong><span>Materialien</span></div>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <p className="fuss">Grünschmiede Greenteam, Malbergweich</p>
    </div>
  );
}
