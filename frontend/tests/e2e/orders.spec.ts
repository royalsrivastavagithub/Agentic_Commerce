import { test, expect } from "@playwright/test"

test.describe("Orders", () => {
  test("orders page loads with heading", async ({ page }) => {
    await page.goto("/orders")
    await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible({ timeout: 10000 })
  })

  test("order list shows orders", async ({ page }) => {
    await page.goto("/orders")
    const orderLinks = page.locator('a[href^="/orders/"]')
    await expect(orderLinks.first()).toBeVisible({ timeout: 10000 })
    const count = await orderLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test("order detail page loads", async ({ page }) => {
    await page.goto("/orders")
    await page.locator('a[href^="/orders/"]').first().click()
    await expect(page.getByRole("heading", { name: /Order #/ })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Shipping Address")).toBeVisible()
  })
})
