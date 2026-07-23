import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

const MITARBEITER_FELDER = ["ort_id", "status", "notiz"];

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

  if (sitzung.rolle !== "admin") {
    for (const feld of Object.keys(patch)) {
      if (!MITARBEITER_FELDER.includes(feld)) {
        return NextResponse.json({ fehler: "keine Berechtigung für dieses Feld" }, { status: 403 });
      }
    }
  }

  const update = { ...patch };
  if (logtext !== undefined) {
    if (logtext === null) {
      update.log = [];
    } else {
      const { data: aktuell } = await db().from("tools").select("log").eq("id", params.id).single();
      update.log = [{ d: heute(), txt: logtext, wer: sitzung.name }, ...((aktuell && aktuell.log) || [])].slice(0, 40);
    }
  }

  const { data, error } = await db().from("tools").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ fehler: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  await db().from("tools").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
