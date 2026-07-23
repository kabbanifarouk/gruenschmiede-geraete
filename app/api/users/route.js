import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, anlegen } from "@/lib/auth";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  const { data } = await db().from("staff").select("id, name, username, rolle").order("created_at", { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(req) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ fehler: "keine Berechtigung" }, { status: e.status || 403 });
  }
  const { name, username, code, rolle } = await req.json();
  try {
    const person = await anlegen(name, username, code, rolle === "admin" ? "admin" : "mitarbeiter");
    return NextResponse.json(person);
  } catch (e) {
    return NextResponse.json({ fehler: e.message }, { status: e.status || 500 });
  }
}
