import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout, { metadata } from "./layout";

vi.mock("./_components/logout-button", () => ({ LogoutButton: () => <button type="button">Wyloguj</button> }));

describe("AdminLayout", () => {
  it("has a title", () => {
    expect(metadata.title).toBe("Panel administracyjny · DevMentor");
  });

  it("renders the navigation, the logout button and the page", () => {
    render(
      <AdminLayout params={Promise.resolve({})}>
        <p>treść strony</p>
      </AdminLayout>,
    );
    const hrefs = screen.getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")]);
    expect(hrefs).toEqual([
      ["DevMentor · Admin", "/admin"],
      ["Użytkownicy", "/admin/users"],
      ["Strona główna", "/"],
    ]);
    expect(screen.getByRole("button", { name: "Wyloguj" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("treść strony");
  });
});
