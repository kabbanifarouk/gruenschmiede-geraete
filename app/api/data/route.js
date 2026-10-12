import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const [v, t, m] = await Promise.all([
      db().from("vehicles").select("*").order("created_at", { ascending: true }),
      db().from("tools").select("*").order("created_at", { ascending: true }),
      db().from("materials").select("*").order("name", { ascending: true }),
    ]);
    return NextResponse.json({ vehicles: v.data || [], tools: t.data || [], materials: m.data || [] });
  } catch (e) {
    return antwortFehler(e);
  }
}
