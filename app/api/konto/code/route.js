import { NextResponse } from "next/server";
import { requireSession, eigenenCodeAendern } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export async function POST(req) {
  try {
    const sitzung = await requireSession();
    const { alt, neu } = await req.json();
    await eigenenCodeAendern(sitzung, alt, neu);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return antwortFehler(e);
  }
}
