"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { useState, type ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  )

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
