"use client";
import { useRouter } from "next/navigation";

export default function Kopf({ nutzer }) {
  const router = useRouter();
  async function abmelden() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="kopf">
      <div className="kopflinks">
        <img className="logo" src="/logo.png" alt="Grünschmiede" style={{ height: 30 }} />
        <div className="kopftext">
          <div className="wortmarke">Grün<span>schmiede</span></div>
          <div className="unter">Gerätebestand · {nutzer.name}{nutzer.rolle === "admin" ? " · Admin" : ""}</div>
        </div>
      </div>
      <button className="ghost" onClick={abmelden}>Abmelden</button>
    </header>
  );
}
