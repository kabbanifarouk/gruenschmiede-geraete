import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { auftragFelder } from "@/lib/auftrag";
import { bilderLoeschen, mitLinks } from "@/lib/notizen";

export const dynamic = "force-dynamic";

// Zeiten und Materialverbrauch eines Auftrags
export async function GET(req, { params }) {
  try {
    await requireSession();
    const [z, m, n] = await Promise.all([
      db().from("zeiten").select("*").eq("auftrag_id", params.id)
        .order("datum", { ascending: false }).order("created_at", { ascending: false }),
      db().from("material_bewegungen").select("*, material:material_id(id, name, einheit, preis)")
        .eq("auftrag_id", params.id).order("created_at", { ascending: false }),
      db().from("auftrag_notizen").select("*").eq("auftrag_id", params.id).order("created_at", { ascending: false }),
    ]);
    if (z.error) throw z.error;
    if (m.error) throw m.error;
    if (n.error) throw n.error;
    return NextResponse.json({ zeiten: z.data || [], material: m.data || [], notizen: await mitLinks(n.data || []) });
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    const felder = auftragFelder(await req.json());
    const { data, error } = await db()
      .from("auftraege")
      .update({ ...felder, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    // Wird der Auftrag abgeschlossen, laufen dort keine Timer mehr weiter
    if (felder.status === "abgeschlossen") {
      const { timerStoppen } = await import("@/lib/zeit");
      const { data: laufend } = await db().from("zeiten").select("id, start").eq("auftrag_id", params.id).eq("quelle", "timer").is("ende", null);
      if (laufend?.length) await timerStoppen(laufend);
    }
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAdmin();
    // Bilder der Notizen aus dem Speicher entfernen, bevor der Auftrag gelöscht wird
    const { data: notizen } = await db().from("auftrag_notizen").select("bilder").eq("auftrag_id", params.id);
    await bilderLoeschen((notizen || []).flatMap((x) => x.bilder || []));
    await db().from("auftraege").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
