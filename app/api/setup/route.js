import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { anlegen, login } from "@/lib/auth";

// Legt den allerersten Admin-Zugang an. Funktioniert nur, solange noch
// kein einziger Zugang existiert, und nur mit dem Setup-Passwort, das
// du selbst in Vercel als Umgebungsvariable SETUP_SECRET hinterlegst.
export async function POST(req) {
  const { name, username, code, setupKey } = await req.json();

  if (!process.env.SETUP_SECRET || setupKey !== process.env.SETUP_SECRET) {
    return NextResponse.json({ fehler: "Setup-Passwort stimmt nicht." }, { status: 403 });
  }

  const { count } = await db().from("staff").select("id", { count: "exact", head: true });
  if (count && count > 0) {
    return NextResponse.json({ fehler: "Es gibt bereits Zugänge. Einrichtung ist schon erfolgt." }, { status: 409 });
  }

  if (!name || !username || !code || code.length < 6) {
    return NextResponse.json({ fehler: "Bitte Name, Benutzername und einen Code mit mindestens 6 Ziffern angeben." }, { status: 400 });
  }

  await anlegen(name, username, code, "admin");
  const ergebnis = await login(username, code);
  return NextResponse.json(ergebnis);
}
