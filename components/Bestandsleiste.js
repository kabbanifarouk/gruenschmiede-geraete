export default function Bestandsleiste({ tools }) {
  const gesamt = tools.length;
  const ok = tools.filter((t) => t.status === "ok").length;
  const auf = gesamt - ok;
  return (
    <div className="bestand">
      <div className="kachel"><span className="kzahl">{gesamt}</span><span className="klabel">Geräte gesamt</span></div>
      <div className="kachel"><span className="kzahl gruen">{ok}</span><span className="klabel">Einsatzbereit</span></div>
      <div className="kachel"><span className={"kzahl" + (auf > 0 ? " rot" : "")}>{auf}</span><span className="klabel">Auffällig</span></div>
    </div>
  );
}
