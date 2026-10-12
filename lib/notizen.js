import crypto from "crypto";
import { db } from "./db";
import { bildDekodieren } from "./bildServer";

export const BUCKET = "belege";
export const MAX_BILDER = 4;
const MAX_GROSS = 1.2 * 1024 * 1024;
const MAX_KLEIN = 80 * 1024;

// Bilder hochladen: je Bild eine große Datei und ein kleines Vorschaubild
export async function bilderHochladen(auftragId, notizId, bilder) {
  const ergebnis = [];
  try {
    for (const b of bilder) {
      const gross = bildDekodieren(b.gross, MAX_GROSS);
      const klein = bildDekodieren(b.klein, MAX_KLEIN);
      const name = crypto.randomBytes(6).toString("hex");
      const pfadGross = `${auftragId}/${notizId}/${name}.${gross.endung}`;
      const pfadKlein = `${auftragId}/${notizId}/${name}-klein.${klein.endung}`;
      for (const [pfad, d] of [[pfadGross, gross], [pfadKlein, klein]]) {
        const { error } = await db().storage.from(BUCKET).upload(pfad, d.puffer, { contentType: d.typ, upsert: false });
        if (error) throw Object.assign(new Error("Bild konnte nicht gespeichert werden: " + error.message), { status: 500 });
      }
      ergebnis.push({
        gross: pfadGross, klein: pfadKlein,
        b: Number(b.b) || null, h: Number(b.h) || null, bytes: gross.puffer.length + klein.puffer.length,
      });
    }
  } catch (e) {
    // Halb hochgeladene Dateien wieder entfernen
    await bilderLoeschen(ergebnis);
    throw e;
  }
  return ergebnis;
}

export async function bilderLoeschen(bilder) {
  const pfade = (bilder || []).flatMap((b) => [b.gross, b.klein]).filter(Boolean);
  if (pfade.length) await db().storage.from(BUCKET).remove(pfade);
}

// Zeitlich begrenzte Links (2 Stunden) für die private Ablage
export async function mitLinks(notizen) {
  const pfade = notizen.flatMap((n) => (n.bilder || []).flatMap((b) => [b.gross, b.klein]));
  if (!pfade.length) return notizen;
  const { data } = await db().storage.from(BUCKET).createSignedUrls(pfade, 7200);
  const links = new Map((data || []).map((x) => [x.path, x.signedUrl]));
  return notizen.map((n) => ({
    ...n,
    bilder: (n.bilder || []).map((b) => ({ ...b, url: links.get(b.gross) || null, vorschau: links.get(b.klein) || links.get(b.gross) || null })),
  }));
}
