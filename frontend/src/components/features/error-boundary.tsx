"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <main id="main-content" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 max-w-md">
            <h1 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = "/"
              }}
            >
              Go home
            </Button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
