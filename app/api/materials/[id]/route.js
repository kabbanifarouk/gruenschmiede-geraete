import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { materialFelder } from "@/lib/material";

export const dynamic = "force-dynamic";

// Bewegungsprotokoll eines Artikels
export async function GET(req, { params }) {
  try {
    await requireSession();
    const { data } = await db()
      .from("material_bewegungen")
      .select("*, auftrag:auftrag_id(id, titel)")
      .eq("material_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return NextResponse.json(data || []);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    const felder = materialFelder(await req.json());
    const { data, error } = await db()
      .from("materials")
      .update({ ...felder, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAdmin();
    await db().storage.from("fotos").remove([`material/${params.id}.jpg`]);
    await db().from("materials").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
