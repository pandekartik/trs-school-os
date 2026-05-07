"use client";

import { useState, useRef } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  async function execute(formData: FormData) {
    setLoading(true);
    try {
      const result = await action(formData);
      if (result?.error) {
        toast.error(options?.errorMessage ?? "Something went wrong", {
          description: result.error,
        });
      } else {
        toast.success(options?.successMessage ?? "Saved successfully");
        formRef.current?.reset();
        options?.onSuccess?.();
      }
    } catch (e) {
      toast.error("Unexpected error", {
        description: "Please try again or contact support.",
      });
    } finally {
      setLoading(false);
    }
  }

  return { loading, execute, formRef };
}