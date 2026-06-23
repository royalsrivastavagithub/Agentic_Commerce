import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReviewSection } from "./product-detail-content"

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useQuery, useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"

const mockedAuth = vi.mocked(useAuthStore)
const mockedQuery = vi.mocked(useQuery)
const mockedMutation = vi.mocked(useMutation)

const mockReviews = [
  {
    id: 1,
    user_id: 1,
    product_id: 1,
    rating: 4,
    comment: "Great product!",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    user: { id: 1, email: "alice@test.com", first_name: "Alice" },
  },
  {
    id: 2,
    user_id: 2,
    product_id: 1,
    rating: 5,
    comment: "Excellent!",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    user: { id: 2, email: "bob@test.com", first_name: "Bob" },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockedQuery.mockReturnValue({ data: mockReviews, refetch: vi.fn() } as any)
  mockedMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as any)
})

describe("ReviewSection", () => {
  it("renders review cards when reviews exist", () => {
    mockedAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as any)

    render(<ReviewSection productId={1} />)

    expect(screen.getByText("Great product!")).toBeInTheDocument()
    expect(screen.getByText("Excellent!")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("renders empty state when no reviews", () => {
    mockedAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as any)
    mockedQuery.mockReturnValue({ data: [], refetch: vi.fn() } as any)

    render(<ReviewSection productId={1} />)

    expect(screen.getByText("No reviews yet. Be the first to review this product!")).toBeInTheDocument()
  })

  it("shows Write a Review button when authenticated and not already reviewed", () => {
    mockedAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 3, email: "new@test.com" },
    } as any)

    render(<ReviewSection productId={1} />)

    expect(screen.getByText("Write a Review")).toBeInTheDocument()
  })

  it("hides Write a Review button when user already reviewed", () => {
    mockedAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: "alice@test.com" },
    } as any)

    render(<ReviewSection productId={1} />)

    expect(screen.queryByText("Write a Review")).not.toBeInTheDocument()
    expect(screen.getByText("You have already reviewed this product.")).toBeInTheDocument()
  })
})
