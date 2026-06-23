import { test as setup, expect } from "@playwright/test"
import path from "path"

const API_BASE = "http://localhost:8000/api/v1"
const authDir = path.resolve("./tests/e2e/.auth")

async function authenticateAs(page: any, request: any, email: string, password: string, file: string) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()

  await page.goto("/")
  await page.evaluate(
    ({ token, userData }: { token: string; userData: Record<string, unknown> }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            token,
            user: userData,
            isAuthenticated: true,
            _hydrated: true,
          },
          version: 0,
        }),
      )
    },
    { token: body.access_token, userData: body.user },
  )
  await page.context().storageState({ path: path.join(authDir, file) })
}

setup("authenticate as alice", async ({ page, request }) => {
  await authenticateAs(page, request, "alice@test.com", "test123", "alice.json")
})

setup("authenticate as admin", async ({ page, request }) => {
  await authenticateAs(page, request, "admin@admin.com", "admin", "admin.json")
})
