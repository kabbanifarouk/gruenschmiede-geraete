import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(req, { params }) {
  let sitzung;
  try { sitzung = await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  if (sitzung.id === params.id) {
    return NextResponse.json({ fehler: "Du kannst deinen eigenen Zugang nicht löschen." }, { status: 400 });
  }
  await db().from("staff").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
