import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { auftragFelder } from "@/lib/auftrag";

export async function POST(req) {
  try {
    await requireAdmin();
    const felder = auftragFelder(await req.json(), true);
    const { data, error } = await db().from("auftraege").insert(felder).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}
