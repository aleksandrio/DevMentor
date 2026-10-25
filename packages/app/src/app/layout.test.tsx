import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

type Element = ReactElement<{ lang?: string; className?: string; children?: ReactElement<{ children?: unknown }> }>;

describe("RootLayout", () => {
  it("has a title", () => {
    expect(metadata.title).toBe("Create Next App");
  });

  // <html> cannot be rendered into a jsdom container, so the element is inspected.
  it("renders <html> with the font variables and the page in <body>", () => {
    const page = <p>strona</p>;
    const html = RootLayout({ children: page, params: Promise.resolve({}) }) as Element;

    expect(html.type).toBe("html");
    expect(html.props.lang).toBe("en");
    expect(html.props.className).toBe("font-geist-sans font-geist-mono h-full antialiased");
    const body = html.props.children!;
    expect(body.type).toBe("body");
    expect(body.props.children).toBe(page);
  });
});
