"use client"

import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}
