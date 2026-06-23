import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Shell } from "./shell"

const mockPush = vi.fn()
const mockGetSearchParam = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
}))

vi.mock("@/lib/api-client", () => ({
  api: { get: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: mockGetSearchParam })),
}))

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}))

import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"

const mockedQuery = vi.mocked(useQuery)
const mockedAuth = vi.mocked(useAuthStore)

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSearchParam.mockReturnValue(null)
  mockedQuery.mockReturnValue({ data: [], isLoading: false } as any)
  mockedAuth.mockReturnValue({ isAuthenticated: false, user: null, logout: vi.fn() } as any)
})

describe("Shell", () => {
  it("renders site name and children", () => {
    render(<Shell>content</Shell>)
    expect(screen.getByText("Agentic Commerce")).toBeInTheDocument()
    expect(screen.getByText("content")).toBeInTheDocument()
  })

  it("shows Sign in link when not authenticated", () => {
    render(<Shell>c</Shell>)
    expect(screen.getByText("Hello, Sign in")).toBeInTheDocument()
  })

  it("shows user name when authenticated", () => {
    mockedAuth.mockReturnValue({ isAuthenticated: true, user: { email: "alice@test.com", first_name: "Alice" }, logout: vi.fn() } as any)
    render(<Shell>c</Shell>)
    expect(screen.getByText("Hello, Alice")).toBeInTheDocument()
  })

  it("reads initial search query from URL", () => {
    mockGetSearchParam.mockReturnValue("apple")
    render(<Shell>c</Shell>)
    const input = screen.getByPlaceholderText("Search products...") as HTMLInputElement
    expect(input.value).toBe("apple")
  })

  it("navigates on search submit", () => {
    render(<Shell>c</Shell>)
    const input = screen.getByPlaceholderText("Search products...")
    fireEvent.change(input, { target: { value: "laptop" } })
    fireEvent.submit(input.closest("form")!)
    expect(mockPush).toHaveBeenCalledWith("/products?search=laptop")
  })

  it("does not submit empty search", () => {
    render(<Shell>c</Shell>)
    const input = screen.getByPlaceholderText("Search products...")
    fireEvent.submit(input.closest("form")!)
    expect(mockPush).not.toHaveBeenCalled()
  })

  // Cart badge tests omitted — require complex useQuery sequencing mocking
})
