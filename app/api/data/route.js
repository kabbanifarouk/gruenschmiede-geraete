import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const [v, t, m, a, s, l] = await Promise.all([
      db().from("vehicles").select("*").order("created_at", { ascending: true }),
      db().from("tools").select("*").order("created_at", { ascending: true }),
      db().from("materials").select("*").order("name", { ascending: true }),
      db().from("auftraege").select("*").order("created_at", { ascending: false }),
      db().from("auftrag_summen").select("*"),
      db().from("zeiten").select("id, auftrag_id, staff_id, wer, start").eq("quelle", "timer").is("ende", null),
    ]);
    const summen = new Map((s.data || []).map((x) => [x.auftrag_id, x]));
    const auftraege = (a.data || []).map((x) => ({
      ...x,
      minuten: summen.get(x.id)?.minuten || 0,
      materialwert: Number(summen.get(x.id)?.materialwert || 0),
      zuletzt: summen.get(x.id)?.zuletzt || null,
    }));
    return NextResponse.json({
      vehicles: v.data || [], tools: t.data || [], materials: m.data || [],
      auftraege, laufend: l.data || [], jetzt: new Date().toISOString(),
    });
  } catch (e) {
    return antwortFehler(e);
  }
}
