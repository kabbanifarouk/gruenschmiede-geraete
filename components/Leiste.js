"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Symbol from "./Symbol";

export default function Leiste({ istAdmin }) {
  const pfad = usePathname();
  const aktiv = (p) => (p === "/dashboard" ? pfad === "/dashboard" || pfad.startsWith("/dashboard/orte") || pfad.startsWith("/dashboard/geraete") : pfad.startsWith(p));
  return (
    <nav className="leiste">
      <Link href="/dashboard" className={aktiv("/dashboard") ? "aktiv" : ""}>
        <Symbol art="halle" groesse={20} /><span>Übersicht</span>
      </Link>
      <Link href="/dashboard/alle" className={pfad.startsWith("/dashboard/alle") ? "aktiv" : ""}>
        <Symbol art="werkzeug" groesse={20} /><span>Alle Geräte</span>
      </Link>
      {istAdmin && (
        <Link href="/dashboard/verwaltung" className={pfad.startsWith("/dashboard/verwaltung") ? "aktiv" : ""}>
          <Symbol art="transporter" groesse={20} /><span>Verwaltung</span>
        </Link>
      )}
    </nav>
  );
}
