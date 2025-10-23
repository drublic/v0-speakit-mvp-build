import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

export interface PDFContent {
  title: string
  content: string
  numPages: number
}

export async function extractFromPDF(fileBuffer: ArrayBuffer): Promise<PDFContent> {
  try {
    const pdf = await getDocument({
      data: new Uint8Array(fileBuffer),
      useSystemFonts: true,
    }).promise

    const numPages = pdf.numPages
    let fullText = ""

    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .trim()
      fullText += pageText + "\n\n"
    }

    // Clean up text
    fullText = fullText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()

    if (!fullText || fullText.length < 100) {
      throw new Error("Could not extract meaningful content from PDF")
    }

    // Try to extract title from metadata or first line
    const metadata = await pdf.getMetadata()
    let title = metadata.info?.Title || ""

    if (!title) {
      // Use first line as title
      const firstLine = fullText.split("\n")[0]
      title = firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine
    }

    return {
      title: title || "Untitled Document",
      content: fullText,
      numPages,
    }
  } catch (error: any) {
    throw new Error(`Failed to extract PDF content: ${error.message}`)
  }
}
