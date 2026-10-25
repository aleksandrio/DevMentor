"use client";

import { useSearchParams } from "next/navigation";

/** The local path to return to after login (`?next=`); never an external URL. */
export function useReturnTo(fallback = "/"): string {
  const next = useSearchParams().get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
