import { describe, it, expect, vi, beforeEach } from "vitest"
import { api, ApiError } from "./api-client"

const origLocation = window.location

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  Object.defineProperty(window, "location", {
    value: { ...origLocation, href: "" },
    writable: true,
  })
})

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as Response)
}

describe("api.get", () => {
  it("sends GET request to correct URL", async () => {
    const fetch = mockFetch(200, { data: "ok" })
    await api.get("/test")
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/test$/),
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("returns parsed JSON on success", async () => {
    mockFetch(200, { id: 1 })
    const result = await api.get<{ id: number }>("/test")
    expect(result).toEqual({ id: 1 })
  })

  it("returns undefined on 204", async () => {
    mockFetch(204, undefined)
    const result = await api.delete("/test")
    expect(result).toBeUndefined()
  })

  it("throws ApiError on non-ok response", async () => {
    mockFetch(404, { detail: "Not found" })
    await expect(api.get("/nonexistent")).rejects.toThrow(ApiError)
  })

  it("throws ApiError with status and message", async () => {
    mockFetch(400, { detail: "Bad request" })
    try {
      await api.get("/bad")
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(400)
      expect((e as ApiError).message).toBe("Bad request")
    }
  })

  it("redirects to login on 401", async () => {
    localStorage.setItem("auth-storage", JSON.stringify({ state: { token: "x" } }))
    mockFetch(401, { detail: "Unauthorized" })
    await api.get("/secret").catch(() => {})
    expect(window.location.href).toBe("/auth/login")
    expect(localStorage.getItem("auth-storage")).toBeNull()
  })
})

describe("api.post", () => {
  it("sends POST with JSON body", async () => {
    const fetch = mockFetch(201, { id: 1 })
    await api.post("/create", { name: "test" })
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      }),
    )
  })

  it("sets Content-Type for JSON body", async () => {
    const fetch = mockFetch(201, {})
    await api.post("/create", { foo: "bar" })
    const call = fetch.mock.calls[0][1] as RequestInit
    expect((call.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
  })
})

describe("ApiError", () => {
  it("has status and message properties", () => {
    const err = new ApiError(403, "Forbidden")
    expect(err.status).toBe(403)
    expect(err.message).toBe("Forbidden")
    expect(err.name).toBe("ApiError")
  })
})
