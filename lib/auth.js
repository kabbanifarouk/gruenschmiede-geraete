import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "gs_session";
const TAGE = 30;
const SPERRDAUER_SEK = 30;
const MAX_VERSUCHE = 5;

export function normUser(u) {
  return (u || "").trim().replace(/\s+/g, "").toLowerCase();
}

function fehler(text, status = 400) {
  return Object.assign(new Error(text), { status });
}

function pruefeCode(code) {
  if (!code || !/^\d{6,8}$/.test(code)) throw fehler("Der Code muss aus 6 bis 8 Ziffern bestehen.");
}

function gleichSicher(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await db()
    .from("sessions")
    .select("staff_id, expires_at, staff:staff_id(id, name, username, rolle)")
    .eq("token", token)
    .maybeSingle();
  if (!data || !data.staff || new Date(data.expires_at) < new Date()) return null;
  return { id: data.staff.id, name: data.staff.name, username: data.staff.username, rolle: data.staff.rolle };
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw fehler("nicht angemeldet", 401);
  return s;
}

export async function requireAdmin() {
  const s = await requireSession();
  if (s.rolle !== "admin") throw fehler("keine Berechtigung", 403);
  return s;
}

async function sitzungStarten(staffId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + TAGE * 24 * 60 * 60 * 1000).toISOString();
  await db().from("sessions").insert({ token, staff_id: staffId, expires_at });
  // Abgelaufene Sitzungen nebenbei aufräumen
  await db().from("sessions").delete().lt("expires_at", new Date().toISOString());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TAGE * 24 * 60 * 60,
  });
}

async function fehlversuchZaehlen(person) {
  const versuche = (person.fehlversuche || 0) + 1;
  if (versuche >= MAX_VERSUCHE) {
    const bis = new Date(Date.now() + SPERRDAUER_SEK * 1000).toISOString();
    await db().from("staff").update({ fehlversuche: 0, gesperrt_bis: bis }).eq("id", person.id);
    return SPERRDAUER_SEK;
  }
  await db().from("staff").update({ fehlversuche: versuche }).eq("id", person.id);
  return 0;
}

function gesperrtNoch(person) {
  if (person.gesperrt_bis && new Date(person.gesperrt_bis) > new Date()) {
    return Math.ceil((new Date(person.gesperrt_bis) - new Date()) / 1000);
  }
  return 0;
}

export async function login(username, code) {
  const { data: person } = await db().from("staff").select("*").eq("username", normUser(username)).maybeSingle();
  if (!person) return { fehler: "Benutzername oder Code stimmt nicht." };

  const rest = gesperrtNoch(person);
  if (rest) return { fehler: `Zu viele Fehlversuche. Bitte ${rest} Sekunden warten.`, gesperrt: rest };

  const passt = await bcrypt.compare(code, person.code_hash);
  if (!passt) {
    const sperre = await fehlversuchZaehlen(person);
    if (sperre) return { fehler: `Zu viele Fehlversuche. Bitte ${sperre} Sekunden warten.`, gesperrt: sperre };
    return { fehler: "Benutzername oder Code stimmt nicht." };
  }

  await db().from("staff").update({ fehlversuche: 0, gesperrt_bis: null }).eq("id", person.id);
  await sitzungStarten(person.id);
  return { ok: true, name: person.name, rolle: person.rolle };
}

export async function logout() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await db().from("sessions").delete().eq("token", token);
  cookies().delete(COOKIE);
}

export async function anlegen(name, username, code, rolle) {
  const sauber = normUser(username);
  if (!name || !name.trim()) throw fehler("Name fehlt.");
  if (sauber.length < 3) throw fehler("Der Benutzername braucht mindestens 3 Zeichen.");
  pruefeCode(code);
  const code_hash = await bcrypt.hash(code, 10);
  const { data, error } = await db()
    .from("staff")
    .insert({ name: name.trim(), username: sauber, code_hash, rolle })
    .select("id, name, username, rolle, created_at")
    .single();
  if (error) {
    if (error.code === "23505") throw fehler("Dieser Benutzername ist schon vergeben.", 409);
    throw error;
  }
  return data;
}

// Neuen Code setzen (durch Admin oder Wiederherstellung). Alle offenen
// Sitzungen der Person werden beendet, damit ein alter Code nirgends mehr gilt.
export async function codeSetzen(staffId, code, sitzungBehalten = null) {
  pruefeCode(code);
  const code_hash = await bcrypt.hash(code, 10);
  const { error } = await db()
    .from("staff")
    .update({ code_hash, fehlversuche: 0, gesperrt_bis: null })
    .eq("id", staffId);
  if (error) throw error;
  let q = db().from("sessions").delete().eq("staff_id", staffId);
  if (sitzungBehalten) q = q.neq("token", sitzungBehalten);
  await q;
}

// Eigenen Code ändern (angemeldet, alter Code nötig)
export async function eigenenCodeAendern(sitzung, alterCode, neuerCode) {
  const { data: person } = await db().from("staff").select("*").eq("id", sitzung.id).single();
  const passt = await bcrypt.compare(alterCode || "", person.code_hash);
  if (!passt) throw fehler("Der aktuelle Code stimmt nicht.", 401);
  const token = cookies().get(COOKIE)?.value;
  await codeSetzen(person.id, neuerCode, token);
}

// Code vergessen: Zurücksetzen mit dem Wiederherstellungsschlüssel (SETUP_SECRET aus Vercel)
export async function mitSchluesselZuruecksetzen(username, schluessel, neuerCode) {
  const geheim = process.env.SETUP_SECRET;
  if (!geheim) {
    throw fehler("Für diese App ist kein Wiederherstellungsschlüssel hinterlegt. Bitte einen anderen Admin fragen.", 400);
  }
  const { data: person } = await db().from("staff").select("*").eq("username", normUser(username)).maybeSingle();
  if (!person) throw fehler("Benutzername oder Wiederherstellungsschlüssel stimmt nicht.", 401);

  const rest = gesperrtNoch(person);
  if (rest) throw fehler(`Zu viele Fehlversuche. Bitte ${rest} Sekunden warten.`, 429);

  if (!gleichSicher(schluessel?.trim(), geheim)) {
    await fehlversuchZaehlen(person);
    throw fehler("Benutzername oder Wiederherstellungsschlüssel stimmt nicht.", 401);
  }
  await codeSetzen(person.id, neuerCode);
  await sitzungStarten(person.id);
  return { ok: true, name: person.name };
}

export async function ersteinrichtung(name, username, code, schluessel) {
  const geheim = process.env.SETUP_SECRET;
  if (!geheim) throw fehler("SETUP_SECRET ist in Vercel nicht gesetzt.", 500);
  if (!gleichSicher(schluessel?.trim(), geheim)) throw fehler("Das Setup-Passwort stimmt nicht.", 401);
  const { count } = await db().from("staff").select("id", { count: "exact", head: true });
  if (count && count > 0) throw fehler("Die App ist bereits eingerichtet.", 409);
  const person = await anlegen(name, username, code, "admin");
  await sitzungStarten(person.id);
  return person;
}
