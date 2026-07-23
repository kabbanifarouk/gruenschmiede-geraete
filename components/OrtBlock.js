import Link from "next/link";
import { STATUS, artFuer } from "@/lib/format";
import { Bild } from "./Bild";
import Symbol from "./Symbol";

export default function OrtBlock({ ort, tools }) {
  const drin = tools.filter((t) => t.ort_id === ort.id);
  const auf = drin.filter((t) => t.status !== "ok").length;
  const sichtbar = drin.slice(0, 6);
  const rest = drin.length - sichtbar.length;
  const fst = STATUS[ort.status || "ok"];
  const istFahrzeug = ort.id !== "lager";
  const frist = ort.faellig ? Math.round((new Date(ort.faellig) - new Date()) / 86400000) : null;

  return (
    <div className="ortblock" style={{ borderLeftColor: istFahrzeug ? fst.band : "#79BE59" }}>
      <Link href={`/dashboard/orte/${ort.id}`} className="ortkarte">
        <span className="ortsymbol"><Bild thumb={ort.thumb} art={istFahrzeug ? "transporter" : "halle"} groesse={28} /></span>
        <span className="ortmitte">
          <span className="ortname">{ort.name}</span>
          {istFahrzeug && (ort.status || "ok") !== "ok" && <span className="fzustand" style={{ color: fst.text }}>{fst.label}</span>}
          {ort.kennzeichen && <span className="kennz">{ort.kennzeichen}</span>}
          {istFahrzeug && frist !== null && frist < 45 && (
            <span className={"ffrist" + (frist < 0 ? " ueber" : "")}>
              {frist < 0 ? `Frist ${-frist} Tage überschritten` : `Frist in ${frist} Tagen`}
            </span>
          )}
        </span>
        <span className="rechts">
          <span className="zahl">{drin.length}</span>
          <span className="zlabel">Geräte</span>
          {auf > 0 && <span className="achtung">{auf} auffällig</span>}
        </span>
      </Link>
      {drin.length > 0 && (
        <div className="mininhalt">
          {sichtbar.map((t) => {
            const st = STATUS[t.status] || STATUS.ok;
            return (
              <Link key={t.id} href={`/dashboard/geraete/${t.id}`} className="minizeile">
                <span className="minipunkt" style={{ background: st.band }} />
                <Bild thumb={t.thumb} art={artFuer(t)} groesse={18} />
                <span className="mininame">{t.name}</span>
                {t.inv_nr && <span className="miniinv mono">{t.inv_nr}</span>}
              </Link>
            );
          })}
          {rest > 0 && <Link href={`/dashboard/orte/${ort.id}`} className="mehr">+ {rest} weitere anzeigen</Link>}
        </div>
      )}
    </div>
  );
}
