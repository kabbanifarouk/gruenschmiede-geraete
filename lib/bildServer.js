// Prüft ein vom Browser geschicktes, bereits verkleinertes Bild (Data-URL)
const ERLAUBT = { "image/webp": "webp", "image/jpeg": "jpg" };

export function bildDekodieren(dataUrl, maxBytes) {
  const m = /^data:(image\/(?:webp|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) throw Object.assign(new Error("Ungültiges Bildformat."), { status: 400 });
  const puffer = Buffer.from(m[2], "base64");
  if (puffer.length > maxBytes) throw Object.assign(new Error("Ein Bild ist zu groß. Bitte erneut versuchen."), { status: 413 });
  return { puffer, typ: m[1], endung: ERLAUBT[m[1]] };
}
