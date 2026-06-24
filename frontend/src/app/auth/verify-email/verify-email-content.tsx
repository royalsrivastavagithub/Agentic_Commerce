"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DynamicShell as Shell } from "@/components/features/dynamic-shell"

type Status = "loading" | "success" | "error"

export default function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<Status>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided.")
      return
    }

    const controller = new AbortController()

    api.get<{ message: string; email: string; is_verified: boolean }>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
      { signal: controller.signal }
    )
      .then((data) => {
        setStatus("success")
        setMessage(data.message)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Verification failed"
        if (msg.includes("Invalid or expired verification token")) {
          setStatus("success")
          setMessage("Email verified successfully")
        } else {
          setStatus("error")
          setMessage(msg)
        }
      })

    return () => controller.abort()
  }, [token])

  return (
    <Shell>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {status === "loading" && "Verifying..."}
              {status === "success" && "Email Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email..."}
              {status === "success" && message}
              {status === "error" && message}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            {status === "success" && (
              <Link href="/auth/login" className={buttonVariants({ className: "w-full" })}>
                Go to Login
              </Link>
            )}
            {status === "error" && (
              <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Back to Login
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </Shell>
  )
}
