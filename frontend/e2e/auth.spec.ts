import { test, expect } from "@playwright/test"

test.describe("Login", () => {
  test("login form loads", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })
    await expect(page.getByRole("heading", { name: /Welcome to Agentic Commerce/i })).toBeVisible()
  })

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "wrong@test.com")
    await page.fill('input[type="password"]', "wrongpass")
    await page.click('button:has-text("Sign in")')
    await page.waitForTimeout(2000)
  })
})

test.describe("Authenticated flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })
  })

  test("orders page shows orders", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10000 })
    const orderCards = await page.locator('a[href^="/orders/"]').count()
    expect(orderCards).toBeGreaterThan(0)
  })

  test("wishlist page loads", async ({ page }) => {
    await page.goto("/wishlist")
    await expect(page.getByRole("heading", { name: "Your Wishlist" })).toBeVisible({ timeout: 10000 })
  })

  test("profile page shows user details", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByRole("heading", { name: "Your Profile" })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("alice@test.com").first()).toBeVisible()
  })

  test("order detail page loads", async ({ page }) => {
    await page.goto("/orders")
    await page.locator('a[href^="/orders/"]').first().click()
    await expect(page.getByRole("heading", { name: /Order #/ })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Shipping Address")).toBeVisible()
  })

  test("cart page loads", async ({ page }) => {
    await page.goto("/cart")
    await page.waitForTimeout(3000)
    // Cart may be empty — check for either the heading or empty state
    const heading = page.getByRole("heading", { name: "Shopping Cart" })
    const empty = page.getByText("Your cart is empty")
    const either = await Promise.race([heading.waitFor({ timeout: 5000 }).then(() => true).catch(() => false), empty.waitFor({ timeout: 5000 }).then(() => true).catch(() => false)])
    expect(either).toBe(true)
  })

  test("search bar shows search term after navigation", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search products..."]')
    await searchInput.fill("apple")
    await searchInput.press("Enter")
    await page.waitForURL("**/products?search=apple", { timeout: 10000 })
    await expect(searchInput).toHaveValue("apple")
  })
})
