import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { count } = await db().from("staff").select("id", { count: "exact", head: true });
  return NextResponse.json({ eingerichtet: !!count && count > 0 });
}
