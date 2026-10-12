import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { fehler } from "@/lib/zeit";
import { bilderLoeschen } from "@/lib/notizen";

async function laden(sitzung, id) {
  const { data } = await db().from("auftrag_notizen").select("*").eq("id", id).maybeSingle();
  if (!data) throw fehler("Notiz nicht gefunden.", 404);
  if (sitzung.rolle !== "admin" && data.staff_id !== sitzung.id) throw fehler("Du kannst nur deine eigenen Notizen ändern.", 403);
  return data;
}

// Text ändern und/oder einzelne Bilder entfernen
export async function PATCH(req, { params }) {
  try {
    const sitzung = await requireSession();
    const n = await laden(sitzung, params.id);
    const { text, bildEntfernen } = await req.json();
    const update = { updated_at: new Date().toISOString() };
    let bilder = n.bilder || [];
    if (bildEntfernen) {
      const weg = bilder.filter((b) => b.gross === bildEntfernen);
      bilder = bilder.filter((b) => b.gross !== bildEntfernen);
      await bilderLoeschen(weg);
      update.bilder = bilder;
    }
    if (text !== undefined) {
      const t = String(text || "").trim();
      if (t.length > 4000) throw fehler("Der Text ist zu lang (max. 4000 Zeichen).");
      update.text = t;
    }
    if (!(update.text ?? n.text) && !bilder.length) throw fehler("Eine Notiz braucht Text oder ein Bild. Zum Entfernen bitte löschen.");
    const { data, error } = await db().from("auftrag_notizen").update(update).eq("id", params.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    const sitzung = await requireSession();
    const n = await laden(sitzung, params.id);
    await bilderLoeschen(n.bilder);
    await db().from("auftrag_notizen").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
