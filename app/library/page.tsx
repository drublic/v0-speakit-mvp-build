"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { getUserContent, deleteContent, type SavedContent } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Trash2, Loader2, FileText, LinkIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function LibraryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [content, setContent] = useState<SavedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }

    if (user && !user.isAnonymous) {
      loadContent()
    }
  }, [user, authLoading, router])

  const loadContent = async () => {
    if (!user) return

    setLoading(true)
    try {
      const userContent = await getUserContent(user.uid)
      setContent(userContent)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your library.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteContent(id)
      setContent(content.filter((item) => item.id !== id))
      toast({
        title: "Deleted",
        description: "Item removed from your library.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpen = (item: SavedContent) => {
    sessionStorage.setItem(
      "speakit_current",
      JSON.stringify({
        title: item.title,
        content: item.content,
        url: item.url,
        type: item.type,
      }),
    )
    router.push("/reader")
  }

  if (authLoading || loading) {
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold">My Library</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {content.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No saved content yet</h2>
            <p className="mb-4 text-muted-foreground">Start saving articles and documents to access them here</p>
            <Button onClick={() => router.push("/")}>Browse Content</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <Card key={item.id} className="flex flex-col p-6">
                <div className="mb-4 flex items-start gap-3">
                  {item.type === "url" ? (
                    <LinkIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="mb-1 line-clamp-2 font-semibold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {item.summary && (
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{item.summary}</p>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => handleOpen(item)} className="flex-1" size="sm">
                    Listen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
