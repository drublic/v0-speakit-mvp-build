"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, LinkIcon, Volume2, Library } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AuthDialog } from "@/components/auth-dialog"

export default function HomePage() {
  const router = useRouter()
  const { user, signInAsGuest, signOut, isGuest, isFirebaseAvailable } = useAuth()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to extract content")
      }

      const data = await response.json()

      // Store in session storage and navigate
      sessionStorage.setItem(
        "speakit_current",
        JSON.stringify({
          title: data.title,
          content: data.content,
          url,
          type: "url",
        }),
      )

      router.push("/reader")
    } catch (err: any) {
      setError(err.message || "Failed to process URL")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to extract PDF content")
      }

      const data = await response.json()

      // Store in session storage and navigate
      sessionStorage.setItem(
        "speakit_current",
        JSON.stringify({
          title: data.title,
          content: data.content,
          type: "pdf",
        }),
      )

      router.push("/reader")
    } catch (err: any) {
      setError(err.message || "Failed to process PDF")
    } finally {
      setLoading(false)
    }
  }

  const handleGuestMode = async () => {
    try {
      await signInAsGuest()
    } catch (error: any) {
      setError(error.message || "Failed to sign in as guest")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">Speakit</h1>
          </div>
          <div className="flex items-center gap-2">
            {isFirebaseAvailable ? (
              <>
                {user ? (
                  <>
                    {!isGuest && (
                      <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
                        <Library className="mr-2 h-4 w-4" />
                        Library
                      </Button>
                    )}
                    {isGuest && (
                      <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
                        Create Account
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleGuestMode}>
                      Continue as Guest
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setAuthDialogOpen(true)}>
                      Sign In
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Demo Mode</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-5xl font-bold tracking-tight">Listen to any article or document</h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Transform web articles and PDFs into natural-sounding audio with AI-powered summarization
          </p>
        </div>

        <div className="space-y-6">
          {/* URL Input */}
          <Card className="p-6">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Enter a URL</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Listen"}
                </Button>
              </div>
            </form>
          </Card>

          {/* PDF Upload */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Upload a PDF</h3>
              </div>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={loading} />
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <h3 className="mb-2 font-semibold">Natural Voices</h3>
            <p className="text-sm text-muted-foreground">
              Choose from multiple high-quality voices with adjustable speed
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="mb-2 font-semibold">AI Summaries</h3>
            <p className="text-sm text-muted-foreground">Get instant summaries powered by advanced AI</p>
          </Card>
          <Card className="p-6">
            <h3 className="mb-2 font-semibold">Save Progress</h3>
            <p className="text-sm text-muted-foreground">Bookmark and sync your reading history across devices</p>
          </Card>
        </div>
      </main>

      {isFirebaseAvailable && <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />}
    </div>
  )
}
