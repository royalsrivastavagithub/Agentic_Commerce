import { test, expect } from "@playwright/test"

test.describe("Admin panel", () => {
  test.use({ storageState: "./tests/e2e/.auth/admin.json" })

  test("dashboard loads with heading", async ({ page }) => {
    await page.goto("/admin/dashboard")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 })
  })

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/admin/dashboard")
    await page.getByRole("link", { name: "Products" }).click()
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible({ timeout: 10000 })
  })

  test("products page shows table", async ({ page }) => {
    await page.goto("/admin/products")
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible({ timeout: 10000 })
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
  })

  test("orders page shows table", async ({ page }) => {
    await page.goto("/admin/orders")
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({ timeout: 10000 })
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
  })

  test("users page shows table", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible({ timeout: 10000 })
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
  })

  test("search users filters results", async ({ page }) => {
    await page.goto("/admin/users")
    await page.locator('input[placeholder="Search users..."]').fill("alice")
    await expect(page.getByText("alice@test.com").first()).toBeVisible({ timeout: 10000 })
  })

  test("reviews page loads", async ({ page }) => {
    await page.goto("/admin/reviews")
    await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible({ timeout: 10000 })
  })

  test("categories page shows table", async ({ page }) => {
    await page.goto("/admin/categories")
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible({ timeout: 10000 })
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
  })

  test("create a new category", async ({ page }) => {
    await page.goto("/admin/categories")
    await page.getByRole("button", { name: "Add Category" }).click()
    await expect(page.getByRole("heading", { name: "Create Category" })).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder("Category name").fill("E2E Test Category")
    await page.getByRole("button", { name: "Create" }).click()
    await expect(page.getByText("E2E Test Category").first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Admin access control", () => {
  test("non-admin user is redirected away", async ({ page }) => {
    await page.goto("/admin/dashboard")
    await expect(page).not.toHaveURL(/\/admin\/dashboard/, { timeout: 10000 })
  })

  test("unauthenticated user sees blank/admin restricted", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto("/admin/dashboard")
    // Admin layout returns null for unauthenticated, so "Dashboard" heading shouldn't appear
    await expect(page.getByRole("heading", { name: "Dashboard" })).not.toBeVisible({ timeout: 5000 })
    await context.close()
  })
})
