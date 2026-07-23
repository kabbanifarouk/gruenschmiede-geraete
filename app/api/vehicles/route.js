import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  const { name, kennzeichen } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ fehler: "Name fehlt" }, { status: 400 });
  const { data, error } = await db()
    .from("vehicles")
    .insert({ name: name.trim(), kennzeichen: kennzeichen || "", status: "ok", log: [] })
    .select()
    .single();
  if (error) return NextResponse.json({ fehler: error.message }, { status: 500 });
  return NextResponse.json(data);
}
