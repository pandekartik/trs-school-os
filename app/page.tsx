import { redirect } from "next/navigation";
import { getLandingRoute, getRole } from "@/lib/auth";

export default async function Home() {
  const role = await getRole();
  if (role) redirect(getLandingRoute(role));
  redirect("/sign-in");
}
