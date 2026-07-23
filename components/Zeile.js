import Link from "next/link";
import { STATUS, artFuer } from "@/lib/format";
import { Bild } from "./Bild";

export default function Zeile({ t, ortName, zeigeOrt }) {
  const st = STATUS[t.status] || STATUS.ok;
  return (
    <Link href={`/dashboard/geraete/${t.id}`} className="karte">
      <span className="band" style={{ "--bf": st.band }} />
      <span className="symbolfeld"><Bild thumb={t.thumb} art={artFuer(t)} groesse={26} /></span>
      <span className="korpus">
        <span className="reihe">
          <span className="gname">{t.name}</span>
          <span className="inv">{t.inv_nr || "—"}</span>
        </span>
        <span className="reihe klein">
          <span className="grau">{t.kategorie || "Ohne Kategorie"}</span>
          <span style={{ color: st.text, fontWeight: 600 }}>{st.label}</span>
        </span>
        {zeigeOrt && <span className="ortzeile">{ortName(t.ort_id)}</span>}
      </span>
    </Link>
  );
}
