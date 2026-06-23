import { test, expect } from "@playwright/test"

test.describe("Profile", () => {
  test("profile page loads with heading", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByRole("heading", { name: "Your Profile" })).toBeVisible({ timeout: 10000 })
  })

  test("profile shows user email", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByText("alice@test.com").first()).toBeVisible({ timeout: 10000 })
  })
})
