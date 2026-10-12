// Bildkompression im Browser – bevor irgendetwas hochgeladen wird.
// Fotos aus dem Handy (oft 3–8 MB) werden auf ca. 100–250 KB gebracht.

let webpGeht = null;
function kannWebp() {
  if (webpGeht === null) {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 2;
      webpGeht = c.toDataURL("image/webp", 0.5).startsWith("data:image/webp");
    } catch (e) { webpGeht = false; }
  }
  return webpGeht;
}

async function laden(datei) {
  // createImageBitmap dreht Handyfotos automatisch richtig herum (EXIF)
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(datei, { imageOrientation: "from-image" }); } catch (e) { /* Rückfall unten */ }
  }
  const url = URL.createObjectURL(datei);
  try {
    return await new Promise((ok, fehler) => {
      const bild = new Image();
      bild.onload = () => ok(bild);
      bild.onerror = () => fehler(new Error("Diese Datei ist kein lesbares Bild."));
      bild.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function zeichnen(bild, breite, hoehe, sx = 0, sy = 0, sb = bild.width, sh = bild.height) {
  const c = document.createElement("canvas");
  c.width = breite;
  c.height = hoehe;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; // transparente PNGs bekommen weißen Grund statt Schwarz
  ctx.fillRect(0, 0, breite, hoehe);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bild, sx, sy, sb, sh, 0, 0, breite, hoehe);
  return c;
}

function alsDaten(canvas, guete) {
  const typ = kannWebp() ? "image/webp" : "image/jpeg";
  const url = canvas.toDataURL(typ, guete);
  return { url, typ, bytes: Math.round((url.length - url.indexOf(",") - 1) * 0.75) };
}

// Großes Bild: längste Kante max. `kante` px. Wird es trotzdem zu groß,
// wird die Qualität schrittweise gesenkt, bis es unter `maxBytes` liegt.
export async function komprimieren(datei, { kante = 1600, guete = 0.72, maxBytes = 350 * 1024 } = {}) {
  const bild = await laden(datei);
  const f = Math.min(1, kante / Math.max(bild.width, bild.height));
  const b = Math.max(1, Math.round(bild.width * f));
  const h = Math.max(1, Math.round(bild.height * f));
  const canvas = zeichnen(bild, b, h);
  let q = guete;
  let ergebnis = alsDaten(canvas, q);
  while (ergebnis.bytes > maxBytes && q > 0.4) {
    q -= 0.08;
    ergebnis = alsDaten(canvas, q);
  }
  return { ...ergebnis, b, h, quelle: bild };
}

// Quadratisches Vorschaubild (Mitte ausgeschnitten), wenige KB
export function vorschau(bild, kante = 240, guete = 0.6) {
  const k = Math.min(bild.width, bild.height);
  const canvas = zeichnen(bild, kante, kante, (bild.width - k) / 2, (bild.height - k) / 2, k, k);
  return alsDaten(canvas, guete);
}

export function kb(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
