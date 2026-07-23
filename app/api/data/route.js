import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
  } catch (e) {
    return NextResponse.json({ fehler: "nicht angemeldet" }, { status: e.status || 401 });
  }
  const [{ data: vehicles }, { data: tools }] = await Promise.all([
    db().from("vehicles").select("*").order("created_at", { ascending: true }),
    db().from("tools").select("*").order("created_at", { ascending: true }),
  ]);
  return NextResponse.json({ vehicles: vehicles || [], tools: tools || [] });
}
