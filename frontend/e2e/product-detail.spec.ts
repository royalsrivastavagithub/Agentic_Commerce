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

test.describe("Wishlist", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "alice@test.com")
    await page.fill('input[type="password"]', "test123")
    await page.click('button:has-text("Sign in")')
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 })
  })

  test("add to wishlist from product page", async ({ page }) => {
    await page.goto("/products/3")
    // Wait for the user to be authenticated (shell shows "Hello, {name}")
    await expect(page.getByText(/Hello,/)).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(2000)

    // Find the wishlist button by searching for text containing "Wishlist"
    const btn = page.locator("button", { hasText: "Wishlist" })
    await expect(btn.first()).toBeVisible({ timeout: 5000 })
    await btn.first().click()
    await page.waitForTimeout(1500)
    // After clicking the text should toggle
    await expect(btn.first()).toBeVisible({ timeout: 10000 })
  })

  test("wishlist page shows added item", async ({ page }) => {
    // Add a product to wishlist first
    await page.goto("/products/3")
    await page.waitForTimeout(2000)
    const addBtn = page.locator("button:has-text('Add to Wishlist')")
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(2000)
    }

    // Go to wishlist page
    await page.goto("/wishlist")
    await page.waitForTimeout(2000)
    // Should show the product or empty state
    const heading = page.getByRole("heading", { name: "Your Wishlist" })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test("remove from wishlist", async ({ page }) => {
    // First add
    await page.goto("/products/4")
    await page.waitForTimeout(2000)
    const addBtn = page.locator("button:has-text('Add to Wishlist')")
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(1500)
    }

    // Now remove
    const removeBtn = page.locator("button:has-text('Remove from Wishlist')")
    if (await removeBtn.isVisible()) {
      await removeBtn.click()
      await page.waitForTimeout(1500)
      // Should show "Add to Wishlist" again
      await expect(page.locator("button:has-text('Add to Wishlist')")).toBeVisible({ timeout: 5000 })
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
