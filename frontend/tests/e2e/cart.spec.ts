import { test, expect } from "@playwright/test"

test.describe("Cart", () => {
  test("cart page loads", async ({ page }) => {
    await page.goto("/cart")
    const heading = page.getByRole("heading", { name: /Shopping Cart|Your cart is empty/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test("add to cart then navigate to cart", async ({ page }) => {
    await page.goto("/products/1")
    await page.getByRole("button", { name: "Add to Cart" }).click()
    await page.goto("/cart")
    await expect(page.getByRole("heading", { name: /Shopping Cart/i })).toBeVisible({ timeout: 10000 })
  })
})
