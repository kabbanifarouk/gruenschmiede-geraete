import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Wird einmal täglich automatisch von Vercel aufgerufen (siehe vercel.json).
// Die kleine Anfrage an die Datenbank verhindert, dass Supabase das
// kostenlose Projekt nach 7 Tagen ohne Nutzung pausiert.
// Es werden keine Daten zurückgegeben, nur ob die Anfrage geklappt hat.

export const dynamic = "force-dynamic";

export async function GET(request) {
  // Optionaler Schutz: Ist CRON_SECRET in Vercel gesetzt, schickt Vercel
  // diesen Wert automatisch mit. Fremde Aufrufe werden dann abgewiesen.
  const geheim = process.env.CRON_SECRET;
  if (geheim && request.headers.get("authorization") !== `Bearer ${geheim}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await db()
    .from("vehicles")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, zeit: new Date().toISOString() });
}
