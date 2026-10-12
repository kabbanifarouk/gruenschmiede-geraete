import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { auftragLaden, fehler, personenPruefen } from "@/lib/zeit";

// Stunden manuell nachtragen (für sich selbst, als Admin auch für mehrere)
export async function POST(req) {
  try {
    const sitzung = await requireSession();
    const { auftrag_id, staff_ids, datum, minuten, notiz } = await req.json();
    await auftragLaden(auftrag_id);
    const min = Math.round(Number(minuten));
    if (!Number.isFinite(min) || min < 1 || min > 1440) throw fehler("Bitte eine Dauer zwischen 1 Minute und 24 Stunden angeben.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum || "")) throw fehler("Bitte ein gültiges Datum angeben.");
    const personen = await personenPruefen(sitzung, staff_ids);
    const zeilen = personen.map((p) => ({
      auftrag_id, staff_id: p.id, wer: p.name, datum, minuten: min,
      quelle: "manuell", notiz: String(notiz || "").trim().slice(0, 500), erfasst_von: sitzung.name,
    }));
    const { error } = await db().from("zeiten").insert(zeilen);
    if (error) throw error;
    return NextResponse.json({ ok: true, anzahl: zeilen.length });
  } catch (e) {
    return antwortFehler(e);
  }
}
