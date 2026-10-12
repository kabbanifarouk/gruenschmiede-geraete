import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { auftragLaden, berlinDatum, fehler, personenPruefen, timerStoppen } from "@/lib/zeit";

// Timer starten – für sich selbst, oder als Admin für mehrere Mitarbeiter.
// Läuft bei jemandem schon ein Timer, kommt eine Rückfrage (wechseln: true stoppt ihn).
export async function POST(req) {
  try {
    const sitzung = await requireSession();
    const { auftrag_id, staff_ids, wechseln } = await req.json();
    const auftrag = await auftragLaden(auftrag_id);
    if (auftrag.status === "abgeschlossen") throw fehler("Dieser Auftrag ist abgeschlossen.", 400);
    const personen = await personenPruefen(sitzung, staff_ids);
    const ids = personen.map((p) => p.id);

    const { data: laufend } = await db()
      .from("zeiten")
      .select("id, start, staff_id, wer, auftrag_id, auftrag:auftrag_id(titel)")
      .in("staff_id", ids).eq("quelle", "timer").is("ende", null);

    const hierSchon = (laufend || []).filter((z) => z.auftrag_id === auftrag_id);
    const woanders = (laufend || []).filter((z) => z.auftrag_id !== auftrag_id);
    if (woanders.length && !wechseln) {
      throw fehler("Es läuft bereits ein Timer auf einem anderen Auftrag.", 409, {
        konflikt: woanders.map((z) => ({ wer: z.wer, auftrag: z.auftrag?.titel || "" })),
      });
    }
    if (woanders.length) await timerStoppen(woanders);

    const jetzt = new Date();
    const neu = personen
      .filter((p) => !hierSchon.some((z) => z.staff_id === p.id))
      .map((p) => ({
        auftrag_id, staff_id: p.id, wer: p.name, start: jetzt.toISOString(), datum: berlinDatum(jetzt),
        quelle: "timer", erfasst_von: sitzung.name,
      }));
    if (neu.length) {
      const { error } = await db().from("zeiten").insert(neu);
      if (error) {
        if (error.code === "23505") throw fehler("Für diese Person läuft schon ein Timer. Bitte Seite neu laden.", 409);
        throw error;
      }
    }
    if (auftrag.status === "geplant") {
      await db().from("auftraege").update({ status: "aktiv", updated_at: jetzt.toISOString() }).eq("id", auftrag_id);
    }
    return NextResponse.json({ ok: true, gestartet: neu.length });
  } catch (e) {
    return antwortFehler(e);
  }
}
