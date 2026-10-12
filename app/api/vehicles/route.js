import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export async function POST(req) {
  try {
    await requireAdmin();
    const { name, kennzeichen } = await req.json();
    if (!name || !name.trim()) return NextResponse.json({ fehler: "Name fehlt." }, { status: 400 });
    const { data, error } = await db()
      .from("vehicles")
      .insert({ name: name.trim(), kennzeichen: (kennzeichen || "").trim().toUpperCase(), status: "ok", log: [] })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return antwortFehler(e);
  }
}
