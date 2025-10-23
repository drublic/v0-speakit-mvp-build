import * as cheerio from "cheerio"

export interface ExtractedContent {
  title: string
  content: string
  author?: string
  publishedDate?: string
}

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove unwanted elements
    $("script, style, nav, header, footer, aside, iframe, noscript").remove()

    // Try to extract title
    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      "Untitled Article"

    // Try to extract author
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $('[rel="author"]').text().trim() ||
      undefined

    // Try to extract published date
    const publishedDate =
      $('meta[property="article:published_time"]').attr("content") || $("time[datetime]").attr("datetime") || undefined

    // Try to find main content
    let content = ""
    const contentSelectors = ["article", '[role="main"]', ".article-content", ".post-content", ".entry-content", "main"]

    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        if (content.length > 200) break
      }
    }

    // Fallback: get all paragraph text
    if (!content || content.length < 200) {
      content = $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 50)
        .join("\n\n")
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim()

    if (!content || content.length < 100) {
      throw new Error("Could not extract meaningful content from URL")
    }

    return {
      title,
      content,
      author,
      publishedDate,
    }
  } catch (error: any) {
    throw new Error(`Failed to extract content: ${error.message}`)
  }
}
