import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  let sitzung;
  try { sitzung = await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  const g = await req.json();
  const eintrag = {
    name: g.name?.trim(),
    kategorie: g.kategorie || "",
    inv_nr: g.invNr || "",
    serien_nr: g.serien || "",
    status: "ok",
    ort_id: g.ort || "lager",
    notiz: "",
    geprueft: g.intervall ? new Date().toISOString().slice(0, 10) : null,
    intervall_monate: g.intervall ? Number(g.intervall) : null,
    log: [{ d: heute(), txt: "Angelegt", wer: sitzung.name }],
  };
  if (!eintrag.name) return NextResponse.json({ fehler: "Bezeichnung fehlt" }, { status: 400 });
  const { data, error } = await db().from("tools").insert(eintrag).select().single();
  if (error) return NextResponse.json({ fehler: error.message }, { status: 500 });
  return NextResponse.json(data);
}

function heute() {
  return new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
