"use client";
import { useEffect } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { STATUS, bestandsLage, fuellProzent, markerProzent } from "@/lib/format";

export function Status({ status, kurz = false }) {
  const s = STATUS[status] || STATUS.ok;
  return <span className={"status " + (STATUS[status] ? status : "ok")}>{kurz ? s.kurz : s.label}</span>;
}

export function Kachel({ thumb, art, groesse = "" }) {
  const px = groesse === "gross" ? 30 : groesse === "klein" ? 17 : 22;
  return (
    <span className={"kachel " + groesse}>
      {thumb ? <img src={thumb} alt="" /> : <Icon name={art} groesse={px} />}
    </span>
  );
}

export function Seitenkopf({ titel, sub, aktionen, zurueck }) {
  return (
    <>
      {zurueck && (
        <Link href={zurueck.href} className="zurueck">
          <Icon name="zurueck" groesse={18} />{zurueck.text}
        </Link>
      )}
      <div className="seitenkopf">
        <div className="seitenkopf-text">
          <h1 className="titel-xl">{titel}</h1>
          {sub && <p className="leise">{sub}</p>}
        </div>
        {aktionen && <div className="seitenkopf-aktionen">{aktionen}</div>}
      </div>
    </>
  );
}

export function Leer({ icon = "kiste", titel, text, children }) {
  return (
    <div className="leer">
      <span className="leer-symbol"><Icon name={icon} groesse={26} /></span>
      <h3 className="titel-m">{titel}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Laden() {
  return <div className="lade" role="status" aria-label="Wird geladen"><span /></div>;
}

export function Dialog({ offen, titel, onClose, children, fuss }) {
  useEffect(() => {
    if (!offen) return undefined;
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    const alt = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = alt; };
  }, [offen, onClose]);

  if (!offen) return null;
  return (
    <div className="schleier" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={titel}>
        <div className="griff" />
        <div className="dialog-kopf">
          <h2 className="titel-m">{titel}</h2>
          <button className="knopf geist rund klein" onClick={onClose} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>
        <div className="dialog-inhalt">{children}</div>
        {fuss && <div className="dialog-fuss">{fuss}</div>}
      </div>
    </div>
  );
}

export function Bestaetigen({ offen, titel, text, knopf = "Löschen", gefahr = true, laeuft, onJa, onNein }) {
  return (
    <Dialog
      offen={offen} titel={titel} onClose={onNein}
      fuss={<>
        <button className="knopf sekundaer" onClick={onNein}>Abbrechen</button>
        <button className={"knopf " + (gefahr ? "gefahr" : "primaer")} onClick={onJa} disabled={laeuft}>{laeuft ? "Einen Moment …" : knopf}</button>
      </>}
    >
      <p className="leise">{text}</p>
    </Dialog>
  );
}

export function Feld({ label, hilfe, fehler, children }) {
  return (
    <label className="feld">
      {label && <span className="feld-label">{label}</span>}
      {children}
      {fehler ? <span className="feld-fehler">{fehler}</span> : hilfe ? <span className="feld-hilfe">{hilfe}</span> : null}
    </label>
  );
}

export function Hinweis({ art = "", icon, children }) {
  const i = icon || (art === "fehler" ? "warnung" : art === "warn" ? "warnung" : art === "ok" ? "haken" : "info");
  return <div className={"hinweisbox " + art} role={art === "fehler" ? "alert" : undefined}><Icon name={i} groesse={18} /><div>{children}</div></div>;
}

export function Segment({ optionen, wert, setzen, breit }) {
  return (
    <div className={"segment" + (breit ? " breit" : "")} role="tablist">
      {optionen.map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={wert === k} className={wert === k ? "aktiv" : ""} onClick={() => setzen(k)}>{l}</button>
      ))}
    </div>
  );
}

export function Fuellstand({ m }) {
  const lage = bestandsLage(m);
  const marker = markerProzent(m);
  return (
    <div className={"fuellstand-balken " + (lage === "ok" ? "" : "ist-" + lage)} aria-hidden="true">
      <span style={{ width: `${fuellProzent(m)}%` }} />
      {marker !== null && <i className="marker" style={{ left: `${marker}%` }} />}
    </div>
  );
}

export function Suche({ wert, setzen, platzhalter }) {
  return (
    <div className="eingabe-gruppe suche">
      <Icon name="suche" groesse={18} />
      <input className="eingabe" type="search" value={wert} onChange={(e) => setzen(e.target.value)} placeholder={platzhalter} />
    </div>
  );
}
