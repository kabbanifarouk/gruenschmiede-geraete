import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, codeSetzen } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

async function anzahlAdmins() {
  const { count } = await db().from("staff").select("id", { count: "exact", head: true }).eq("rolle", "admin");
  return count || 0;
}

// Admin: Name, Rolle ändern oder neuen Code vergeben
export async function PATCH(req, { params }) {
  try {
    const sitzung = await requireAdmin();
    const { name, rolle, code } = await req.json();
    const { data: person } = await db().from("staff").select("id, rolle").eq("id", params.id).maybeSingle();
    if (!person) return NextResponse.json({ fehler: "Zugang nicht gefunden." }, { status: 404 });

    const update = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ fehler: "Name fehlt." }, { status: 400 });
      update.name = name.trim();
    }
    if (rolle !== undefined) {
      const neu = rolle === "admin" ? "admin" : "mitarbeiter";
      if (person.rolle === "admin" && neu !== "admin") {
        if (sitzung.id === params.id) return NextResponse.json({ fehler: "Du kannst dir die Admin-Rechte nicht selbst entziehen." }, { status: 400 });
        if ((await anzahlAdmins()) <= 1) return NextResponse.json({ fehler: "Es muss mindestens ein Admin bleiben." }, { status: 400 });
      }
      update.rolle = neu;
    }
    if (Object.keys(update).length) {
      const { error } = await db().from("staff").update(update).eq("id", params.id);
      if (error) throw error;
    }
    if (code !== undefined) await codeSetzen(params.id, code);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function DELETE(req, { params }) {
  try {
    const sitzung = await requireAdmin();
    if (sitzung.id === params.id) {
      return NextResponse.json({ fehler: "Du kannst deinen eigenen Zugang nicht löschen." }, { status: 400 });
    }
    const { data: person } = await db().from("staff").select("rolle").eq("id", params.id).maybeSingle();
    if (person?.rolle === "admin" && (await anzahlAdmins()) <= 1) {
      return NextResponse.json({ fehler: "Es muss mindestens ein Admin bleiben." }, { status: 400 });
    }
    await db().from("staff").delete().eq("id", params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
