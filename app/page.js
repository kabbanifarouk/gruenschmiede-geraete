import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Start() {
  const sitzung = await getSession();
  redirect(sitzung ? "/dashboard" : "/login");
}
