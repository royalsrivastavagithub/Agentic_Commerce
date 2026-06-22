"use client"

import dynamic from "next/dynamic"

const ProductDetailContent = dynamic(() => import("./product-detail-content"), { ssr: false })

export default function ProductDetailPage() {
  return <ProductDetailContent />
}
