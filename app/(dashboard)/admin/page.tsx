import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage academic setup, users, and internal operations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Invite staff, create admin accounts, and manage access roles.
          </div>
          <Button asChild>
            <Link href="/admin/users">Open users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
