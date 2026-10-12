import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { darfZeitAendern, fehler } from "@/lib/zeit";

async function laden(sitzung, id) {
  const { data: z } = await db().from("zeiten").select("*").eq("id", id).maybeSingle();
  if (!z) throw fehler("Eintrag nicht gefunden.", 404);
  if (!darfZeitAendern(sitzung, z)) throw fehler("Du kannst nur deine eigenen Zeiten ändern.", 403);
  return z;
}

export async function PATCH(req, { params }) {
  try {
    const sitzung = await requireSession();
    const z = await laden(sitzung, params.id);
    const { datum, minuten, notiz } = await req.json();
    const update = {};
    if (notiz !== undefined) update.notiz = String(notiz || "").trim().slice(0, 500);
    const laeuft = z.quelle === "timer" && !z.ende;
    if (minuten !== undefined && !laeuft) {
      const min = Math.round(Number(minuten));
      if (!Number.isFinite(min) || min < 1 || min > 1440) throw fehler("Bitte eine Dauer zwischen 1 Minute und 24 Stunden angeben.");
      update.minuten = min;
    }
    if (datum !== undefined && !laeuft) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw fehler("Bitte ein gültiges Datum angeben.");
      update.datum = datum;
    }
    const { data, error } = await db().from("zeiten").update(update).eq("id", params.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    const sitzung = await requireSession();
    await laden(sitzung, params.id);
    await db().from("zeiten").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
