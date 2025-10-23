import { type NextRequest, NextResponse } from "next/server"
import { extractFromPDF } from "@/lib/pdf-extractor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const content = await extractFromPDF(arrayBuffer)

    return NextResponse.json(content)
  } catch (error: any) {
    console.error("PDF extraction error:", error)
    return NextResponse.json({ error: error.message || "Failed to extract PDF content" }, { status: 500 })
  }
}
