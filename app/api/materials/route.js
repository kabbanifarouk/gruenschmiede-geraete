import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { materialFelder, zahl } from "@/lib/material";

export async function POST(req) {
  try {
    const sitzung = await requireAdmin();
    const b = await req.json();
    const felder = materialFelder(b, true);
    const start = zahl(b.bestand) || 0;
    const { data, error } = await db()
      .from("materials")
      .insert({ ...felder, bestand: start })
      .select()
      .single();
    if (error) throw error;
    await db().from("material_bewegungen").insert({
      material_id: data.id, art: "angelegt", menge: start, bestand_nach: start, notiz: "", wer: sitzung.name,
    });
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}
