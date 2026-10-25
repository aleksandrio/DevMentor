import { renderHook } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useReturnTo } from "./use-return-to";

vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));

function withNext(next: string | null) {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(next === null ? "" : `next=${encodeURIComponent(next)}`) as unknown as ReturnType<typeof useSearchParams>,
  );
}

describe("useReturnTo", () => {
  it("returns a local ?next= path", () => {
    withNext("/admin/users");
    expect(renderHook(() => useReturnTo()).result.current).toBe("/admin/users");
  });

  it.each([null, "https://evil.example", "//evil.example", "admin"])("falls back for %s", (next) => {
    withNext(next);
    expect(renderHook(() => useReturnTo("/start")).result.current).toBe("/start");
    expect(renderHook(() => useReturnTo()).result.current).toBe("/");
  });
});
