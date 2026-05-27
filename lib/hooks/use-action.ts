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

  async function submitFormData(formData: FormData, form?: HTMLFormElement) {
    setLoading(true);
    try {
      const result = await action(formData);
      if (result?.error) {
        toast.error(options?.errorMessage ?? "Something went wrong", {
          description: result.error,
        });
      } else {
        toast.success(options?.successMessage ?? "Saved successfully");
        form?.reset();
        options?.onSuccess?.();
      }
      return result;
    } catch {
      toast.error("Unexpected error", {
        description: "Please try again or contact support.",
      });
      return { error: "Unexpected error" };
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await submitFormData(new FormData(form), form);
  }

  return { loading, handleSubmit, submitFormData };
}
