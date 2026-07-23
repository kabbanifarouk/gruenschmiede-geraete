import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Ohne diese Zeile könnte Next.js die Antwort einmalig zwischenspeichern –
// dann bliebe die Einrichtungsseite für immer sichtbar, selbst nachdem
// der erste Zugang längst angelegt wurde.
export const dynamic = "force-dynamic";

export async function GET() {
  const { count } = await db().from("staff").select("id", { count: "exact", head: true });
  return NextResponse.json({ eingerichtet: !!count && count > 0 });
}
