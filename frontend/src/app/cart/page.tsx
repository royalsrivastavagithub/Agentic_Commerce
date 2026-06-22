"use client"

import dynamic from "next/dynamic"

const CartContent = dynamic(() => import("./cart-content"), { ssr: false })

export default function CartPage() {
  return <CartContent />
}
