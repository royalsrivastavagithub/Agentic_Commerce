"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const VerifyEmailContent = dynamic(() => import("./verify-email-content"), { ssr: false })

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
