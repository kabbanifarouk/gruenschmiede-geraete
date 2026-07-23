import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

// Das Bild wird im Browser bereits verkleinert (siehe Upload-Komponente).
// Diese Route bekommt zwei fertige Bilder: einen winzigen Vorschau-Ausschnitt
// (kommt direkt in die Datenbankzeile) und ein großes Foto (geht in den
// Supabase-Speicher). Ein fester Dateiname pro Gerät sorgt dafür, dass beim
// Austauschen kein alter Datenmüll liegen bleibt.

function ausTyp(art) {
  return art === "vehicle" ? "vehicles" : "tools";
}

export async function POST(req) {
  let sitzung;
  try { sitzung = await requireSession(); } catch (e) {
    return NextResponse.json({ fehler: "nicht angemeldet" }, { status: e.status || 401 });
  }
  const { art, id, thumb, gross } = await req.json();
  if (!["tool", "vehicle"].includes(art) || !id || !thumb || !gross) {
    return NextResponse.json({ fehler: "Unvollständige Anfrage" }, { status: 400 });
  }

  const tabelle = ausTyp(art);
  const base64 = gross.split(",")[1];
  const puffer = Buffer.from(base64, "base64");
  const pfad = `${art}/${id}.jpg`;

  const { error: hochladeFehler } = await db().storage
    .from("fotos")
    .upload(pfad, puffer, { contentType: "image/jpeg", upsert: true });
  if (hochladeFehler) return NextResponse.json({ fehler: hochladeFehler.message }, { status: 500 });

  const { data: oeffentlich } = db().storage.from("fotos").getPublicUrl(pfad);
  // Zeitstempel an die URL hängen, damit alte, zwischengespeicherte Bilder
  // im Browser sofort durch das neue Foto ersetzt werden.
  const url = `${oeffentlich.publicUrl}?v=${Date.now()}`;

  const { error: dbFehler } = await db()
    .from(tabelle)
    .update({ foto_url: url, thumb, hat_bild: true })
    .eq("id", id);
  if (dbFehler) return NextResponse.json({ fehler: dbFehler.message }, { status: 500 });

  return NextResponse.json({ url, thumb });
}

export async function DELETE(req) {
  try { await requireSession(); } catch (e) {
    return NextResponse.json({ fehler: "nicht angemeldet" }, { status: e.status || 401 });
  }
  const { art, id } = await req.json();
  if (!["tool", "vehicle"].includes(art) || !id) {
    return NextResponse.json({ fehler: "Unvollständige Anfrage" }, { status: 400 });
  }
  const tabelle = ausTyp(art);
  const pfad = `${art}/${id}.jpg`;
  await db().storage.from("fotos").remove([pfad]);
  await db().from(tabelle).update({ foto_url: null, thumb: null, hat_bild: false }).eq("id", id);
  return NextResponse.json({ ok: true });
}
