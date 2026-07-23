import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

function heute() {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export async function PATCH(req, { params }) {
  let sitzung;
  try { sitzung = await requireSession(); } catch (e) {
    return NextResponse.json({ fehler: "nicht angemeldet" }, { status: e.status || 401 });
  }
  const body = await req.json();
  const { logtext, ...patch } = body;

  const update = { ...patch };
  if (logtext !== undefined) {
    if (logtext === null) {
      update.log = [];
    } else {
      const { data: aktuell } = await db().from("vehicles").select("log").eq("id", params.id).single();
      update.log = [{ d: heute(), txt: logtext, wer: sitzung.name }, ...((aktuell && aktuell.log) || [])].slice(0, 40);
    }
  }

  const { data, error } = await db().from("vehicles").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ fehler: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  // Geräte aus dem entfernten Fahrzeug wandern zurück ins Lager.
  await db().from("tools").update({ ort_id: "lager" }).eq("ort_id", params.id);
  await db().from("vehicles").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
