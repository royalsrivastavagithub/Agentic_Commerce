import { test, expect } from "@playwright/test"

test.describe("Products page", () => {
  test("search shows product results", async ({ page }) => {
    await page.goto("/products?search=laptop")
    const productLinks = page.locator("a[href^='/products/']")
    await expect(productLinks.first()).toBeVisible({ timeout: 10000 })
    const count = await productLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test("empty search shows no results message", async ({ page }) => {
    await page.goto("/products?search=zzzzzzzzzzznoresults")
    await expect(page.getByText("No results found")).toBeVisible({ timeout: 10000 })
  })

  test("sort select is visible in sidebar", async ({ page }) => {
    await page.goto("/products?search=laptop")
    await expect(page.getByText("Sort by")).toBeVisible({ timeout: 10000 })
    await expect(page.locator("aside select").first()).toBeVisible()
  })

  test("min rating filter updates URL", async ({ page }) => {
    await page.goto("/products?search=laptop")
    const ratingBtn = page.locator("aside button").filter({ hasText: /up|star/i }).first()
    if (await ratingBtn.isVisible().catch(() => false)) {
      await ratingBtn.click()
      await expect(page).toHaveURL(/min_rating=/, { timeout: 5000 })
    }
  })
})

test.describe("Pagination", () => {
  test("pagination nav appears when many results", async ({ page }) => {
    await page.goto("/products")
    const pagination = page.getByRole("navigation", { name: "pagination" })
    await expect(pagination).toBeVisible({ timeout: 10000 })
  })

  test("clicking page 2 changes displayed products", async ({ page }) => {
    await page.goto("/products")
    const page2 = page.getByRole("navigation", { name: "pagination" }).getByRole("button").filter({ hasText: "2" })
    await expect(page2.first()).toBeVisible({ timeout: 10000 })
    // Scope h3 to product card links only (avoid sidebar "Sort by" h3)
    const productTitles = page.locator("a[href^='/products/'] h3")
    const firstTitle = await productTitles.first().textContent()
    await page2.first().click()
    await expect(productTitles.first()).not.toHaveText(firstTitle!, { timeout: 10000 })
  })
})
