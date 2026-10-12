import { NextResponse } from "next/server";
import { ersteinrichtung } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { name, username, code, setupKey } = await req.json();
    const person = await ersteinrichtung(name, username, code, setupKey);
    return NextResponse.json({ ok: true, name: person.name });
  } catch (e) {
    return antwortFehler(e);
  }
}
