"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import type { Product } from "@/types/api"

export function ProductCard({ product, newTab }: { product: Product; newTab?: boolean }) {
  const discounted = product.price * (1 - (product.discountPercentage ?? product.discount_percentage ?? 0) / 100)

  return (
    <Link
      href={`/products/${product.id}`}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="flex gap-4 rounded-lg border bg-white p-3 transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-border dark:bg-card"
    >
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-md bg-white sm:h-32 sm:w-32">
        <img
          src={product.thumbnail || "/placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-1">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-amazon-link sm:text-base">
            {product.title}
          </h3>

          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground sm:line-clamp-2">
            {product.description}
          </p>

          <div className="mt-2 flex items-center gap-1">
            <div className="flex" role="img" aria-label={`${Math.round(product.rating)} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{product.brand}</span>
          {product.brand && <span>•</span>}
          <span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>
            {product.stock > 0 ? "In Stock" : "Out of stock"}
          </span>
        </div>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-end justify-center sm:w-28">
        {(product.discountPercentage ?? product.discount_percentage ?? 0) > 0 ? (
          <>
            <span className="text-lg font-bold sm:text-xl">₹{discounted.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
            <span className="mt-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
              -{product.discountPercentage ?? product.discount_percentage ?? 0}%
            </span>
          </>
        ) : (
          <span className="text-lg font-bold sm:text-xl">₹{product.price.toFixed(2)}</span>
        )}
      </div>
    </Link>
  )
}
