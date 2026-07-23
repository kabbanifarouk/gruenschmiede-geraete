import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "gs_session";
const TAGE = 30;
const SPERRDAUER_SEK = 20;
const MAX_VERSUCHE = 3;

function normUser(u) {
  return (u || "").trim().replace(/\s+/g, "").toLowerCase();
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const { data } = await db()
    .from("sessions")
    .select("staff_id, expires_at, staff:staff_id(id, name, username, rolle)")
    .eq("token", token)
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return { id: data.staff.id, name: data.staff.name, username: data.staff.username, rolle: data.staff.rolle };
}

export async function requireSession() {
  const s = await getSession();
  if (!s) {
    const err = new Error("nicht angemeldet");
    err.status = 401;
    throw err;
  }
  return s;
}

export async function requireAdmin() {
  const s = await requireSession();
  if (s.rolle !== "admin") {
    const err = new Error("keine Berechtigung");
    err.status = 403;
    throw err;
  }
  return s;
}

export async function login(username, code) {
  const sauber = normUser(username);
  const { data: person } = await db()
    .from("staff")
    .select("*")
    .eq("username", sauber)
    .maybeSingle();

  if (!person) return { fehler: "Benutzername oder Code stimmt nicht." };

  if (person.gesperrt_bis && new Date(person.gesperrt_bis) > new Date()) {
    const rest = Math.ceil((new Date(person.gesperrt_bis) - new Date()) / 1000);
    return { fehler: `Zu viele Fehlversuche. Noch ${rest} Sekunden warten.`, gesperrt: rest };
  }

  const passt = await bcrypt.compare(code, person.code_hash);
  if (!passt) {
    const versuche = person.fehlversuche + 1;
    if (versuche >= MAX_VERSUCHE) {
      const bis = new Date(Date.now() + SPERRDAUER_SEK * 1000).toISOString();
      await db().from("staff").update({ fehlversuche: 0, gesperrt_bis: bis }).eq("id", person.id);
      return { fehler: `Zu viele Fehlversuche. Noch ${SPERRDAUER_SEK} Sekunden warten.`, gesperrt: SPERRDAUER_SEK };
    }
    await db().from("staff").update({ fehlversuche: versuche }).eq("id", person.id);
    return { fehler: "Benutzername oder Code stimmt nicht." };
  }

  await db().from("staff").update({ fehlversuche: 0, gesperrt_bis: null }).eq("id", person.id);

  const token = crypto.randomBytes(32).toString("hex");
  const expires_at = new Date(Date.now() + TAGE * 24 * 60 * 60 * 1000).toISOString();
  await db().from("sessions").insert({ token, staff_id: person.id, expires_at });

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TAGE * 24 * 60 * 60,
  });

  return { ok: true, name: person.name, rolle: person.rolle };
}

export async function logout() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await db().from("sessions").delete().eq("token", token);
  cookies().delete(COOKIE);
}

export async function anlegen(name, username, code, rolle) {
  const sauber = normUser(username);
  if (sauber.length < 3) throw Object.assign(new Error("Benutzername zu kurz"), { status: 400 });
  if (!code || code.length < 6) throw Object.assign(new Error("Code zu kurz"), { status: 400 });
  const code_hash = await bcrypt.hash(code, 10);
  const { data, error } = await db()
    .from("staff")
    .insert({ name, username: sauber, code_hash, rolle })
    .select("id, name, username, rolle")
    .single();
  if (error) {
    if (error.code === "23505") throw Object.assign(new Error("Benutzername ist schon vergeben"), { status: 409 });
    throw error;
  }
  return data;
}
