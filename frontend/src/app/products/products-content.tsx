"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Product, ProductListResponse, Category } from "@/types/api"
import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Star, Search, ChevronDown, X } from "lucide-react"
import { DynamicShell as Shell } from "@/components/features/dynamic-shell"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const LIMIT = 12

function CategoryCombobox({
  categories,
  value,
  onChange,
}: {
  categories: Category[] | undefined
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = useMemo(() => {
    if (!categories) return []
    if (!search) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  }, [categories, search])

  const label = value === "all" ? "All Categories" : value

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-amazon-link"
      >
        <span className={value === "all" ? "text-gray-500" : "text-gray-900"}>{label}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-white shadow-lg">
          <div className="relative border-b">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 pl-8 text-sm outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-auto">
            <button
              onClick={() => { onChange("all"); setOpen(false); setSearch("") }}
              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${value === "all" ? "font-bold text-amazon-link" : "text-gray-700"}`}
            >
              All Categories
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.name); setOpen(false); setSearch("") }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${value === c.name ? "font-bold text-amazon-link" : "text-gray-700"}`}
              >
                {c.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No categories found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsContent() {
  const searchParams = useSearchParams()
  const searchFromUrl = searchParams.get("search") ?? ""
  const [category, setCategory] = useState<string>("all")
  const [sort, setSort] = useState<string>("default")
  const [page, setPage] = useState(1)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minRating, setMinRating] = useState<number>(0)

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  })

  const categoryIdMap = useMemo(() => {
    const m = new Map<string, number>()
    categories?.forEach((c) => m.set(c.name, c.id))
    return m
  }, [categories])

  const resetFilters = () => {
    setCategory("all")
    setSort("default")
    setPage(1)
    setMinPrice("")
    setMaxPrice("")
    setMinRating(0)
  }

  const hasFilters = category !== "all" || sort !== "default" || minPrice || maxPrice || minRating > 0

  const skip = (page - 1) * LIMIT
  const productsQueryKey = searchFromUrl
    ? ["products", "search", searchFromUrl, page, minPrice, maxPrice, minRating]
    : ["products", "list", skip, LIMIT, category, sort, minPrice, maxPrice, minRating]

  const { data: productsData, isLoading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => {
      if (searchFromUrl) {
        return api.get<ProductListResponse>(
          `/products/search?q=${encodeURIComponent(searchFromUrl)}&skip=${skip}&limit=${LIMIT}`,
        )
      }
      if (category !== "all") {
        const catId = categoryIdMap.get(category)
        if (catId) {
          return api.get<ProductListResponse>(`/categories/${catId}/products?skip=${skip}&limit=${LIMIT}`)
        }
      }
      return api.get<ProductListResponse>(`/products?skip=${skip}&limit=${LIMIT}`)
    },
  })

  const allProducts = productsData?.products ?? []
  const total = productsData?.total ?? 0

  const products = useMemo(() => {
    let p = [...allProducts]

    if (minPrice) {
      const m = parseFloat(minPrice)
      if (!isNaN(m)) p = p.filter((x) => (x.price * (1 - (x.discount_percentage || 0) / 100)) >= m)
    }
    if (maxPrice) {
      const m = parseFloat(maxPrice)
      if (!isNaN(m)) p = p.filter((x) => (x.price * (1 - (x.discount_percentage || 0) / 100)) <= m)
    }
    if (minRating > 0) {
      p = p.filter((x) => x.rating >= minRating)
    }

    if (sort === "price-asc") p.sort((a, b) => a.price - b.price)
    else if (sort === "price-desc") p.sort((a, b) => b.price - a.price)
    else if (sort === "rating") p.sort((a, b) => b.rating - a.rating)

    return p
  }, [allProducts, minPrice, maxPrice, minRating, sort])

  const totalPages = Math.ceil(products.length / LIMIT)
  const displayProducts = products.slice(0, LIMIT)

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-muted-foreground">
          {searchFromUrl ? (
            <>
              <Link href="/products" className="text-amazon-link hover:underline">All</Link>
              <span className="mx-1">›</span>
              <span>Results for &quot;{searchFromUrl}&quot;</span>
            </>
          ) : (
            <span>{products.length} results</span>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="space-y-5">
              {/* Sort */}
              <div>
                <h3 className="mb-1.5 text-sm font-bold text-gray-900">Sort by</h3>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1) }}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-amazon-link"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <h3 className="mb-1.5 text-sm font-bold text-gray-900">Category</h3>
                <CategoryCombobox categories={categories} value={category} onChange={(v) => { setCategory(v); setPage(1) }} />
              </div>

              {/* Price range */}
              <div>
                <h3 className="mb-1.5 text-sm font-bold text-gray-900">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-amazon-link"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-amazon-link"
                  />
                </div>
              </div>

              {/* Rating filter */}
              <div>
                <h3 className="mb-1.5 text-sm font-bold text-gray-900">Min. Rating</h3>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className={`flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-50 ${
                        minRating === r ? "bg-gray-100 font-medium" : "text-gray-600"
                      }`}
                    >
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs">& up</span>
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button onClick={resetFilters} className="text-sm font-medium text-amazon-link hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-lg bg-gray-200" />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                      <div className="h-5 w-1/3 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg text-gray-600">No results found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
                <button onClick={resetFilters} className="mt-4 text-sm font-medium text-amazon-link hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>1-{Math.min(displayProducts.length, LIMIT)} of {products.length} results</span>
                  {category !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {category}
                      <button onClick={() => { setCategory("all"); setPage(1) }} className="ml-1 hover:text-foreground">✕</button>
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, page - 2)
                        const p = start + i
                        if (p > totalPages) return null
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink onClick={() => setPage(p)} isActive={p === page} className="cursor-pointer">
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

function ProductCard({ product }: { product: Product }) {
  const discounted = product.price * (1 - (product.discount_percentage || 0) / 100)

  return (
    <Link
      href={`/products/${product.id}`}
      className="group rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-lg"
    >
      <div className="mb-2 flex items-center justify-center overflow-hidden rounded-md bg-white">
        <img
          src={product.thumbnail || "/placeholder.svg"}
          alt={product.title}
          className="h-48 w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
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
              className={`h-3 w-3 ${i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">({product.review_count})</span>
      </div>

      <div className="mt-2">
        {product.discount_percentage > 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">₹{discounted.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-lg font-bold">₹{product.price.toFixed(2)}</span>
        )}
        {product.discount_percentage > 0 && (
          <span className="ml-1 text-xs text-green-700">({product.discount_percentage}% off)</span>
        )}
      </div>

      {product.stock <= 5 && product.stock > 0 && (
        <p className="mt-1 text-xs text-destructive">Only {product.stock} left in stock.</p>
      )}
      {product.stock === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Out of stock</p>
      )}
    </Link>
  )
}
