import { redirect } from "next/navigation";

// Alte Adresse – leitet auf die neue Geräteliste um
export default function Alt() {
  redirect("/dashboard/geraete");
}
