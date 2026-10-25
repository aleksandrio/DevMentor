import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiCallError,
  apiCall,
  apiCallOrThrow,
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  readJsonSafe,
} from "./api-call";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function lastRequestInit(): RequestInit {
  const init = fetchMock.mock.calls.at(-1)?.[1];
  if (!init) {
    throw new Error("fetch was not called with init");
  }
  return init;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("readJsonSafe", () => {
  it("parses a JSON body", async () => {
    await expect(readJsonSafe(new Response('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it("returns null for an empty body", async () => {
    await expect(readJsonSafe(new Response(""))).resolves.toBeNull();
  });

  it("returns null for a non-JSON body", async () => {
    await expect(readJsonSafe(new Response("<html>Bad gateway</html>"))).resolves.toBeNull();
  });
});

describe("apiCall", () => {
  it("sends a GET with the CSRF header and no body by default", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: [1, 2] }));

    const result = await apiCall<number[]>("/api/users");

    expect(result).toEqual({ ok: true, status: 200, data: [1, 2] });
    expect(fetchMock).toHaveBeenCalledWith("/api/users", expect.anything());
    const init = lastRequestInit();
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.credentials).toBe("same-origin");
    expect(init.headers).toEqual({
      Accept: "application/json",
      [CSRF_HEADER]: CSRF_HEADER_VALUE,
    });
    expect(CSRF_HEADER).toBe("X-Requested-With");
    expect(CSRF_HEADER_VALUE).toBe("devmentor");
  });

  it("serialises the body as JSON and passes the method and signal", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { id: "1" } }, 201));
    const controller = new AbortController();

    const result = await apiCall("/api/users", {
      method: "POST",
      body: { email: "a@example.com" },
      signal: controller.signal,
    });

    expect(result).toEqual({ ok: true, status: 201, data: { id: "1" } });
    const init = lastRequestInit();
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"email":"a@example.com"}');
    expect(init.signal).toBe(controller.signal);
    expect(init.headers).toEqual({
      Accept: "application/json",
      [CSRF_HEADER]: CSRF_HEADER_VALUE,
      "Content-Type": "application/json",
    });
  });

  it("returns the server error with field errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          error: { code: "validation_error", message: "Błąd", fieldErrors: { email: ["Zły e-mail"] } },
        },
        400,
      ),
    );

    await expect(apiCall("/api/users")).resolves.toEqual({
      ok: false,
      status: 400,
      error: { code: "validation_error", message: "Błąd", fieldErrors: { email: ["Zły e-mail"] } },
    });
  });

  it("drops field errors that are not an object", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: false, error: { code: "conflict", message: "Zajęte", fieldErrors: "x" } }, 409),
    );

    await expect(apiCall("/api/users")).resolves.toEqual({
      ok: false,
      status: 409,
      error: { code: "conflict", message: "Zajęte", fieldErrors: undefined },
    });
  });

  it.each([
    ["a non-JSON body", new Response("oops", { status: 502 }), 502],
    ["a non-object body", jsonResponse(42, 500), 500],
    ["a body without a boolean ok", jsonResponse({ ok: "yes" }, 200), 200],
    ["an error that is not an object", jsonResponse({ ok: false, error: null }, 500), 500],
    ["an error without a string code", jsonResponse({ ok: false, error: { code: 1, message: "m" } }, 500), 500],
    ["an error without a string message", jsonResponse({ ok: false, error: { code: "c" } }, 500), 500],
  ])("reports %s as a malformed response", async (_label, response, status) => {
    fetchMock.mockResolvedValue(response);

    const result = await apiCall("/api/users");

    expect(result).toMatchObject({ ok: false, status, error: { code: "malformed_response" } });
  });

  it("returns a network error when fetch rejects without a signal", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await apiCall("/api/users");

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: "network_error" } });
  });

  it("returns a network error when fetch rejects and the signal is not aborted", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await apiCall("/api/users", { signal: new AbortController().signal });

    expect(result).toMatchObject({ ok: false, status: 0, error: { code: "network_error" } });
  });

  it("rethrows the error when the signal was aborted", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Aborted", "AbortError");
    fetchMock.mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    });

    await expect(apiCall("/api/users", { signal: controller.signal })).rejects.toBe(abortError);
  });
});

describe("apiCallOrThrow", () => {
  it("returns the data on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { id: "1" } }));

    await expect(apiCallOrThrow("/api/users/1")).resolves.toEqual({ id: "1" });
  });

  it("throws an ApiCallError with the status, code and field errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { ok: false, error: { code: "validation_error", message: "Błąd", fieldErrors: { name: ["Wymagane"] } } },
        400,
      ),
    );

    const error = await apiCallOrThrow("/api/users", { method: "POST", body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiCallError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "ApiCallError",
      message: "Błąd",
      code: "validation_error",
      status: 400,
      fieldErrors: { name: ["Wymagane"] },
    });
  });
});
