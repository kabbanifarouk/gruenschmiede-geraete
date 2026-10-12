import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, anlegen } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export async function GET() {
  try {
    await requireAdmin();
    const { data } = await db()
      .from("staff")
      .select("id, name, username, rolle, gesperrt_bis, created_at")
      .order("created_at", { ascending: true });
    return NextResponse.json(data || []);
  } catch (e) {
    return antwortFehler(e);
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    const { name, username, code, rolle } = await req.json();
    const person = await anlegen(name, username, code, rolle === "admin" ? "admin" : "mitarbeiter");
    return NextResponse.json(person);
  } catch (e) {
    return antwortFehler(e);
  }
}
