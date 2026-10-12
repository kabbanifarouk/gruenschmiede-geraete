import { NextResponse } from "next/server";
import { mitSchluesselZuruecksetzen } from "@/lib/auth";
import { antwortFehler } from "@/lib/route";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { username, schluessel, code } = await req.json();
    const r = await mitSchluesselZuruecksetzen(username, schluessel, code);
    return NextResponse.json(r);
  } catch (e) {
    return antwortFehler(e);
  }
}
