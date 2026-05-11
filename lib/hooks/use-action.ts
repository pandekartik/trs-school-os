"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

type ActionResult = { success?: boolean; error?: string } | undefined;
type Action = (formData: FormData) => Promise<ActionResult>;

export function useAction(
  action: Action,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
  }
) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    try {
      const result = await action(formData);
      if (result?.error) {
        toast.error(options?.errorMessage ?? "Something went wrong", {
          description: result.error,
        });
      } else {
        toast.success(options?.successMessage ?? "Saved successfully");
        form.reset();
        options?.onSuccess?.();
      }
    } catch {
      toast.error("Unexpected error", {
        description: "Please try again or contact support.",
      });
    } finally {
      setLoading(false);
    }
  }

  return { loading, handleSubmit };
}
