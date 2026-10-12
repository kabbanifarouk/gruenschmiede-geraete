import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { bildDekodieren } from "@/lib/bildServer";

// Das Bild wird im Browser bereits verkleinert und komprimiert (lib/bild.js).
// Diese Route bekommt zwei fertige Bilder: einen winzigen Vorschau-Ausschnitt
// (kommt direkt in die Datenbankzeile) und ein großes Foto (geht in den
// Supabase-Speicher). Ein fester Dateiname pro Gerät sorgt dafür, dass beim
// Austauschen kein alter Datenmüll liegen bleibt.

const TABELLEN = { tool: "tools", vehicle: "vehicles", material: "materials" };

function ausTyp(art) {
  return TABELLEN[art];
}

export async function POST(req) {
  try { await requireSession(); } catch (e) {
    return NextResponse.json({ fehler: "nicht angemeldet" }, { status: e.status || 401 });
  }
  const { art, id, thumb, gross } = await req.json();
  if (!TABELLEN[art] || !id || !thumb || !gross) {
    return NextResponse.json({ fehler: "Unvollständige Anfrage" }, { status: 400 });
  }

  const tabelle = ausTyp(art);
  let bild;
  try { bild = bildDekodieren(gross, 1.5 * 1024 * 1024); } catch (e) {
    return NextResponse.json({ fehler: e.message }, { status: e.status || 400 });
  }
  if (String(thumb).length > 60000) return NextResponse.json({ fehler: "Vorschaubild zu groß" }, { status: 413 });
  const pfad = `${art}/${id}.${bild.endung}`;
  // Ältere Version in anderem Format entfernen, damit kein Datenmüll bleibt
  await db().storage.from("fotos").remove([`${art}/${id}.jpg`, `${art}/${id}.webp`].filter((x) => x !== pfad));

  const { error: hochladeFehler } = await db().storage
    .from("fotos")
    .upload(pfad, bild.puffer, { contentType: bild.typ, upsert: true });
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
  if (!TABELLEN[art] || !id) {
    return NextResponse.json({ fehler: "Unvollständige Anfrage" }, { status: 400 });
  }
  const tabelle = ausTyp(art);
  await db().storage.from("fotos").remove([`${art}/${id}.jpg`, `${art}/${id}.webp`]);
  await db().from(tabelle).update({ foto_url: null, thumb: null, hat_bild: false }).eq("id", id);
  return NextResponse.json({ ok: true });
}
