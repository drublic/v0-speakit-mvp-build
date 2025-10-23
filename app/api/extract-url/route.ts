import { type NextRequest, NextResponse } from "next/server"
import { extractFromUrl } from "@/lib/content-extractor"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const content = await extractFromUrl(url)

    return NextResponse.json(content)
  } catch (error: any) {
    console.error("URL extraction error:", error)
    return NextResponse.json({ error: error.message || "Failed to extract content" }, { status: 500 })
  }
}
