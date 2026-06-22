"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Product, ProductListResponse, Category } from "@/types/api"
import Link from "next/link"
import { Star, ChevronRight, Sparkles, Truck, RotateCcw, Shield } from "lucide-react"
import { DynamicShell as Shell } from "@/components/features/dynamic-shell"

export default function HomeContent() {
  const { data: featured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: () => api.get<ProductListResponse>("/products?skip=0&limit=8"),
  })

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  })

  const products = featured?.products ?? []

  return (
    <Shell>
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-amazon-nav2 to-amazon-nav">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center text-white">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Welcome to Agentic Commerce
            </h1>
            <p className="mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">
              Discover amazing products at unbeatable prices. Free shipping on orders over ₹500.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/products"
                className="rounded-full bg-amazon-accent px-8 py-3 text-sm font-semibold text-amazon-nav shadow-sm hover:brightness-95"
              >
                Shop Now
              </Link>
              <Link
                href="/products?search=deals"
                className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Today&apos;s Deals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { icon: Truck, label: "Free Shipping", desc: "On orders ₹500+" },
            { icon: RotateCcw, label: "Easy Returns", desc: "30-day return policy" },
            { icon: Shield, label: "Secure Payment", desc: "100% secure checkout" },
            { icon: Sparkles, label: "Premium Quality", desc: "Verified products" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="h-8 w-8 shrink-0 text-amazon-link" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Featured Products */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-amazon-link hover:underline">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <FeaturedCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-white p-4 text-center transition-shadow hover:shadow-md"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amazon-accent/10 text-xl font-bold text-amazon-link">
                    {cat.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  )
}

function FeaturedCard({ product }: { product: Product }) {
  const discounted = product.price * (1 - (product.discount_percentage || 0) / 100)

  return (
    <Link
      href={`/products/${product.id}`}
      className="group rounded-lg border bg-white p-3 transition-shadow hover:shadow-lg"
    >
      <div className="mb-2 flex items-center justify-center overflow-hidden rounded-md bg-white">
        <img
          src={product.thumbnail || "/placeholder.svg"}
          alt={product.title}
          className="h-36 w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 sm:h-44"
        />
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-amazon-link group-hover:underline">
        {product.title}
      </h3>
      <div className="mt-1 flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">({product.review_count})</span>
      </div>
      <p className="mt-2 text-lg font-bold">₹{discounted.toFixed(2)}</p>
    </Link>
  )
}
