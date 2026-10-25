import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AgentBrowser } from "../../../test/integration/agent-browser";
import { testBaseUrl } from "../../../test/integration/context";
import { appUrl, promoteToAdmin, registerThroughApi, uniqueEmail } from "./support";

describe("the running app with PostgreSQL", () => {
  let browser: AgentBrowser;

  beforeEach(() => {
    browser = new AgentBrowser(testBaseUrl());
  });

  afterEach(async () => {
    await browser.close();
  });

  it("reports the database as up", async () => {
    const response = await fetch(appUrl("/api/health"));
    expect(await response.json()).toMatchObject({ ok: true, data: { database: { state: "up" } } });
  });

  it("registers through the form and logs the new user in", async () => {
    await browser.open("/register");
    await browser.fillByLabel("Imię lub nazwa", "Ala Testowa");
    await browser.fillByLabel("E-mail", uniqueEmail("ui-register"));
    await browser.fillByLabel("Hasło", "password123");
    await browser.clickButton("Załóż konto");
    await browser.waitForPath("/");

    // The session cookie is set: a student gets the access-denied card, not the login page.
    await browser.open("/admin/users");
    await browser.waitForText("Brak uprawnień");
    expect(await browser.path()).toBe("/admin/users");
  });

  it("shows a generic error for a wrong password", async () => {
    const email = uniqueEmail("ui-wrong-password");
    await registerThroughApi(email);

    await browser.open("/login");
    await browser.fillByLabel("E-mail", email);
    await browser.fillByLabel("Hasło", "wrong-password");
    await browser.clickButton("Zaloguj się");
    await browser.waitForText("Nieprawidłowe dane logowania.");
    expect(await browser.path()).toBe("/login");
  });

  it("returns an admin to the user list after login and lists the accounts", async () => {
    const email = uniqueEmail("ui-admin");
    await registerThroughApi(email);
    await promoteToAdmin(email);

    await browser.open("/admin/users");
    await browser.waitForPath("/login?next=/admin/users");
    await browser.fillByLabel("E-mail", email);
    await browser.fillByLabel("Hasło", "password123");
    await browser.clickButton("Zaloguj się");
    await browser.waitForPath("/admin/users");
    await browser.waitForText(email);
    expect(await browser.text("table")).toContain("administrator");
  });
});
