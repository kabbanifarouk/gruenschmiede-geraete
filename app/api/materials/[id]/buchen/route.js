import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";
import { zahl } from "@/lib/material";

// Zugang / Abgang darf jeder angemeldete Mitarbeiter buchen.
// Eine Korrektur (Inventur: Bestand direkt setzen) nur Admins.
export async function POST(req, { params }) {
  try {
    const sitzung = await requireSession();
    const { art, menge, notiz } = await req.json();
    if (!["zugang", "abgang", "korrektur"].includes(art)) {
      return NextResponse.json({ fehler: "Unbekannte Buchungsart." }, { status: 400 });
    }
    if (art === "korrektur" && sitzung.rolle !== "admin") {
      return NextResponse.json({ fehler: "Nur Admins dürfen den Bestand korrigieren." }, { status: 403 });
    }
    const m = zahl(menge);
    if (m === null || (art !== "korrektur" && m <= 0)) {
      return NextResponse.json({ fehler: "Bitte eine Menge größer als 0 eingeben." }, { status: 400 });
    }
    const { data, error } = await db().rpc("material_buchen", {
      p_id: params.id, p_art: art, p_menge: m, p_notiz: (notiz || "").trim(), p_wer: sitzung.name,
    });
    if (error) return NextResponse.json({ fehler: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}
