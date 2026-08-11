"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type BranchOption = { id: string; name: string };

type Props = {
  branches: BranchOption[];
  activeBranchId: string | null;
};

export function BranchSwitcher({ branches, activeBranchId }: Props) {
  const router = useRouter();
  const [posting, setPosting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const switching = posting || isPending;

  if (branches.length === 0) return null;

  async function handleChange(branchId: string) {
    setPosting(true);
    try {
      const res = await fetch("/api/set-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_id: branchId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error("Could not switch branch", { description: body.error });
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
      <Select value={activeBranchId ?? undefined} onValueChange={handleChange} disabled={switching}>
        <SelectTrigger className="h-8 text-xs gap-1.5">
          {switching ? (
            <Loader2 className="size-3.5 animate-spin text-text-muted" />
          ) : (
            <Building2 className="size-3.5 text-text-muted" />
          )}
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
