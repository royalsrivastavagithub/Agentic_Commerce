import dynamic from "next/dynamic"

export const DynamicShell = dynamic(
  () => import("@/components/features/shell").then((m) => ({ default: m.Shell })),
  { ssr: false },
)
