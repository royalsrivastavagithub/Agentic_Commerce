import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Shell } from "./shell"

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  })),
}))

vi.mock("@/lib/api-client", () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
}))

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: vi.fn() })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Shell", () => {
  it("renders the header with the site name", () => {
    render(<Shell>content</Shell>)
    expect(screen.getByText("Agentic Commerce")).toBeInTheDocument()
  })

  it("renders children", () => {
    render(<Shell>Hello World</Shell>)
    expect(screen.getByText("Hello World")).toBeInTheDocument()
  })
})
