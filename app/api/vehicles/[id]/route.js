import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";
import { antwortFehler, heuteKurz } from "@/lib/route";

const MITARBEITER_FELDER = ["status", "notiz", "faellig"];
const ADMIN_FELDER = [...MITARBEITER_FELDER, "name", "kennzeichen"];

export async function PATCH(req, { params }) {
  try {
    const sitzung = await requireSession();
    const { logtext, ...patch } = await req.json();
    const erlaubt = sitzung.rolle === "admin" ? ADMIN_FELDER : MITARBEITER_FELDER;
    for (const feld of Object.keys(patch)) {
      if (!erlaubt.includes(feld)) {
        return NextResponse.json({ fehler: "Keine Berechtigung für dieses Feld." }, { status: 403 });
      }
    }
    if (patch.name !== undefined && !String(patch.name).trim()) {
      return NextResponse.json({ fehler: "Name fehlt." }, { status: 400 });
    }

    const update = { ...patch };
    if (logtext !== undefined) {
      if (logtext === null) {
        if (sitzung.rolle !== "admin") return NextResponse.json({ fehler: "Keine Berechtigung." }, { status: 403 });
        update.log = [];
      } else {
        const { data: aktuell } = await db().from("vehicles").select("log").eq("id", params.id).single();
        update.log = [{ d: heuteKurz(), txt: logtext, wer: sitzung.name }, ...((aktuell && aktuell.log) || [])].slice(0, 60);
      }
    }

    const { data, error } = await db().from("vehicles").update(update).eq("id", params.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAdmin();
    // Geräte aus dem entfernten Fahrzeug wandern zurück ins Lager.
    await db().from("tools").update({ ort_id: "lager" }).eq("ort_id", params.id);
    await db().storage.from("fotos").remove([`vehicle/${params.id}.jpg`, `vehicle/${params.id}.webp`]);
    await db().from("vehicles").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
