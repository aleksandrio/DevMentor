import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins class names and skips falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("lets a later Tailwind class override a conflicting one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
