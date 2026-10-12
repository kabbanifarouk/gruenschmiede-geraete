import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { darfZeitAendern, fehler, timerStoppen } from "@/lib/zeit";

export async function POST(req, { params }) {
  try {
    const sitzung = await requireSession();
    const { data: z } = await db().from("zeiten").select("*").eq("id", params.id).maybeSingle();
    if (!z) throw fehler("Eintrag nicht gefunden.", 404);
    if (!darfZeitAendern(sitzung, z)) throw fehler("Keine Berechtigung.", 403);
    if (z.quelle !== "timer" || z.ende) return NextResponse.json(z);
    const [gestoppt] = await timerStoppen([z]);
    return NextResponse.json(gestoppt || z);
  } catch (e) {
    return antwortFehler(e);
  }
}
