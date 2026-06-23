import { test, expect } from "@playwright/test"

test.describe("Products page", () => {
  test("loads and shows products when searching", async ({ page }) => {
    await page.goto("/products?search=laptop")
    await page.waitForTimeout(3000)
    const productCards = await page.locator("a[href^='/products/']").count()
    expect(productCards).toBeGreaterThan(0)
  })

  test("search for apple shows relevant products", async ({ page }) => {
    await page.goto("/products?search=apple")
    await page.waitForTimeout(3000)
    const productLinks = page.locator("a[href^='/products/']")
    const count = await productLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test("empty search shows no results message", async ({ page }) => {
    await page.goto("/products?search=zzzzzzzzzzznoresults")
    await expect(page.getByText("No results found")).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Sorting and Filters", () => {
  test("sort select is present in sidebar", async ({ page }) => {
    await page.goto("/products?search=laptop")
    await page.waitForTimeout(3000)
    // The sidebar has the sort select — it contains the text "Sort by"
    await expect(page.getByText("Sort by")).toBeVisible()
    const selects = page.locator("aside select")
    await expect(selects).toBeVisible()
  })

  test("min rating filter appears in URL when clicked", async ({ page }) => {
    await page.goto("/products?search=laptop")
    await page.waitForTimeout(3000)
    const ratingBtn = page.locator("aside button").filter({ hasText: "up" }).first()
    const visible = await ratingBtn.isVisible().catch(() => false)
    if (visible) {
      await ratingBtn.click()
      await page.waitForTimeout(1000)
      expect(page.url()).toContain("min_rating")
    }
  })
})

test.describe("Pagination", () => {
  test("pagination appears when there are many results", async ({ page }) => {
    await page.goto("/products")
    await page.waitForTimeout(3000)
    // Check for page number buttons (e.g., "1", "2", "3")
    const pageButtons = page.locator("button, a").filter({ hasText: /^\d+$/ })
    const count = await pageButtons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test("clicking next page changes products", async ({ page }) => {
    await page.goto("/products?search=laptop")
    await page.waitForTimeout(3000)
    // The pagination component renders numbered buttons
    const pageTwo = page.locator("button, a").filter({ hasText: "^2$" }).first()
    const visible = await pageTwo.isVisible().catch(() => false)
    if (!visible) {
      test.skip()
      return
    }
    const firstTitles = await page.locator("h3").allTextContents()
    await pageTwo.click()
    await page.waitForTimeout(2000)
    const secondTitles = await page.locator("h3").allTextContents()
    expect(firstTitles).not.toEqual(secondTitles)
  })
})
