"use client"

import type { Product } from "@/types/api"

interface CartSummaryProps {
  products: Product[]
}

export function CartSummary({ products }: CartSummaryProps) {
  const items = products
    .filter((p) => p.cart_qty && p.cart_qty > 0)
    .map((p) => ({
      title: p.title,
      thumbnail: p.thumbnail,
      qty: p.cart_qty!,
      unitPrice: p.cart_unit_price ?? p.price,
      subtotal: p.cart_subtotal ?? p.cart_qty! * p.price,
    }))

  if (items.length === 0) return null

  const totalQty = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.subtotal, 0)

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-border dark:bg-card">
      <div className="mb-3 flex items-center gap-2 border-b pb-2">
        <span className="text-lg">🛒</span>
        <span className="font-semibold text-foreground">Shopping Cart</span>
        <span className="ml-auto text-sm text-muted-foreground">{totalQty} item{totalQty !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white">
              <img
                src={item.thumbnail || "/placeholder.svg"}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="flex-1 truncate text-foreground">{item.title}</span>
            <span className="w-12 text-right text-muted-foreground">×{item.qty}</span>
            <span className="w-20 text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</span>
            <span className="w-20 text-right font-medium text-foreground">${item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-2 font-semibold text-foreground">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
