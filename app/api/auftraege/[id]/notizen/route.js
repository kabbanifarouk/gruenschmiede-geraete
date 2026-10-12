import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { auftragLaden, fehler } from "@/lib/zeit";
import { MAX_BILDER, bilderHochladen, mitLinks } from "@/lib/notizen";

// Neue Notiz mit optionalen Bildern (Bilder kommen bereits komprimiert vom Browser)
export async function POST(req, { params }) {
  try {
    const sitzung = await requireSession();
    await auftragLaden(params.id);
    const { text, bilder } = await req.json();
    const t = String(text || "").trim();
    const liste = Array.isArray(bilder) ? bilder : [];
    if (!t && !liste.length) throw fehler("Bitte einen Text schreiben oder ein Bild hinzufügen.");
    if (t.length > 4000) throw fehler("Der Text ist zu lang (max. 4000 Zeichen).");
    if (liste.length > MAX_BILDER) throw fehler(`Maximal ${MAX_BILDER} Bilder pro Notiz.`);

    const id = crypto.randomUUID();
    const hochgeladen = await bilderHochladen(params.id, id, liste);
    const { data, error } = await db().from("auftrag_notizen").insert({
      id, auftrag_id: params.id, staff_id: sitzung.id, wer: sitzung.name, text: t, bilder: hochgeladen,
    }).select().single();
    if (error) {
      const { bilderLoeschen } = await import("@/lib/notizen");
      await bilderLoeschen(hochgeladen);
      throw error;
    }
    const [mitUrl] = await mitLinks([data]);
    return NextResponse.json(mitUrl);
  } catch (e) {
    return antwortFehler(e);
  }
}
