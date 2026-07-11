/**
 * Client-side PDF/text extraction for resume upload.
 * Uses pdf.js with a CDN worker; falls back gracefully.
 */

export async function extractTextFromFile(file: File): Promise<{
  text: string;
  error?: string;
}> {
  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    try {
      const text = await file.text();
      return { text };
    } catch {
      return { text: "", error: "Could not read text file." };
    }
  }

  try {
    const pdfjs = await import("pdfjs-dist");
    // Match installed pdfjs version for worker compatibility
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];
    const max = Math.min(doc.numPages, 12);

    for (let i = 1; i <= max; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? String(item.str) : ""))
        .join(" ");
      pages.push(text);
    }

    const joined = pages.join("\n").replace(/\s+/g, " ").trim();
    if (joined.length < 40) {
      return {
        text: joined,
        error:
          "Little text found — the PDF may be scanned/image-based. Paste key bullets below.",
      };
    }
    return { text: joined };
  } catch (err) {
    console.warn("PDF parse failed", err);
    return {
      text: "",
      error:
        "Couldn't parse this PDF in-browser. Try another file or paste text below.",
    };
  }
}
