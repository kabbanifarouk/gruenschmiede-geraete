import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req) {
  const { username, code } = await req.json();
  if (!username || !code) {
    return NextResponse.json({ fehler: "Benutzername und Code angeben." }, { status: 400 });
  }
  const ergebnis = await login(username, code);
  if (ergebnis.fehler) return NextResponse.json(ergebnis, { status: 401 });
  return NextResponse.json(ergebnis);
}
