import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const role = await getRole();
  if (role !== "super_admin") redirect("/admin");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Activity log — coming soon</p>
    </div>
  );
}
