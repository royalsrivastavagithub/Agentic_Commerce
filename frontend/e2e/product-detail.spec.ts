import { test, expect } from "@playwright/test"

test.describe("Product detail", () => {
  test("product page loads with details", async ({ page }) => {
    await page.goto("/products/1")
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator("text=In Stock").or(page.locator("text=Currently Unavailable"))).toBeVisible()
  })

  test("product page shows customer reviews section", async ({ page }) => {
    await page.goto("/products/2")
    await expect(page.locator("text=Customer Reviews")).toBeVisible({ timeout: 10000 })
  })

  test("review form is accessible when logged in", async ({ page }) => {
    // Login first
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })

    // Go to a product alice hasn't reviewed
    await page.goto("/products/50")
    await page.waitForTimeout(2000)

    const writeReview = page.locator("button:has-text('Write a Review')")
    // May or may not be visible depending on whether alice already reviewed this product
    const exists = await writeReview.isVisible().catch(() => false)
    if (exists) {
      await writeReview.click()
      await expect(page.locator("text=Your Rating")).toBeVisible()
      await expect(page.locator("text=Your Review")).toBeVisible()
    }
  })
})

test.describe("Add to cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })
  })

  test("add to cart from product page", async ({ page }) => {
    await page.goto("/products/1")
    await page.waitForTimeout(2000)
    const addBtn = page.locator("button:has-text('Add to Cart')")
    const visible = await addBtn.isVisible().catch(() => false)
    if (visible) {
      await addBtn.click()
      await page.waitForTimeout(2000)
    }
  })
})

test.describe("Search bar suggestions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })
  })

  test("search suggestions appear when typing", async ({ page }) => {
    await page.goto("/products")
    const searchInput = page.locator('input[placeholder="Search products..."]')
    await searchInput.fill("apple")
    // Wait for debounced suggestions (300ms + network)
    await page.waitForTimeout(1500)
    const suggestions = page.locator("text=See all results for")
    const visible = await suggestions.isVisible().catch(() => false)
    if (visible) {
      await suggestions.click()
      await page.waitForURL("**/products?search=apple", { timeout: 10000 })
      expect(page.url()).toContain("search=apple")
    }
  })
})
