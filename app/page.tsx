import { redirect } from "next/navigation";
import { getRole } from "@/lib/auth";

export default async function Home() {
  const role = await getRole();
  if (role === "admin" || role === "coordinator") redirect("/admin");
  if (role === "teacher") redirect("/teacher");
  redirect("/sign-in");
}
