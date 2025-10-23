import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Truncate content if too long (max ~8000 words for context)
    const truncatedContent = content.split(" ").slice(0, 8000).join(" ")

    const { text } = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt: `Summarize the following article in 3-5 concise sentences. Focus on the main points and key takeaways:\n\n${truncatedContent}`,
      maxTokens: 300,
    })

    return NextResponse.json({ summary: text })
  } catch (error: any) {
    console.error("Summarization error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 })
  }
}
