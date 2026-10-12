import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { antwortFehler, heuteKurz } from "@/lib/route";

export async function POST(req) {
  try {
    const sitzung = await requireAdmin();
    const g = await req.json();
    const eintrag = {
      name: g.name?.trim(),
      kategorie: (g.kategorie || "").trim(),
      inv_nr: (g.invNr || "").trim(),
      serien_nr: (g.serien || "").trim(),
      status: "ok",
      ort_id: g.ort || "lager",
      notiz: "",
      geprueft: g.intervall ? (g.geprueft || new Date().toISOString().slice(0, 10)) : null,
      intervall_monate: g.intervall ? Number(g.intervall) : null,
      log: [{ d: heuteKurz(), txt: "Angelegt", wer: sitzung.name }],
    };
    if (!eintrag.name) return NextResponse.json({ fehler: "Bezeichnung fehlt." }, { status: 400 });
    const { data, error } = await db().from("tools").insert(eintrag).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}
