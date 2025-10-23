"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TTSReader } from "@/components/tts-reader"
import { ArrowLeft, Sparkles, Loader2, BookmarkPlus, BookmarkCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { saveContent } from "@/lib/storage"

interface ContentData {
  title: string
  content: string
  url?: string
  type: "url" | "pdf"
}

export default function ReaderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [summary, setSummary] = useState<string>("")
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("speakit_current")
    if (stored) {
      setContentData(JSON.parse(stored))
    } else {
      router.push("/")
    }
  }, [router])

  const handleGenerateSummary = async () => {
    if (!contentData) return

    setIsLoadingSummary(true)
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentData.content }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleSaveToLibrary = async () => {
    if (!contentData || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save to your library.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await saveContent(user.uid, {
        title: contentData.title,
        content: contentData.content,
        url: contentData.url,
        type: contentData.type,
        summary: summary || undefined,
      })

      setIsSaved(true)
      toast({
        title: "Saved!",
        description: "Added to your library.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!contentData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={isSaving || isSaved}>
            {isSaved ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-6">
          <TTSReader content={contentData.content} title={contentData.title} autoPlay={true} />

          {/* AI Summary Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-5 w-5" />
                  AI Summary
                </h3>
                {!summary && (
                  <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} size="sm">
                    {isLoadingSummary ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Summary"
                    )}
                  </Button>
                )}
              </div>

              {summary && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-pretty leading-relaxed">{summary}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Full Content */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Full Content</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-pretty leading-relaxed whitespace-pre-wrap">{contentData.content}</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
