import * as pdfjsLib from "pdfjs-dist";
import type { RenderedPage } from "@/types/assessment";

export type { RenderedPage };

// Setup PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not set PDF worker URL:", e);
}

/**
 * Converts an uploaded File (PDF or Image) into an array of rendered page data URLs.
 */
export async function processUploadFile(file: File): Promise<RenderedPage[]> {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const pages: RenderedPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Render at 1.8x scale for crisp OCR and high-res display
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await (page as any).render({ canvasContext: context, viewport, canvas }).promise;
        pages.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL("image/png"),
        });
      }

      if (pages.length > 0) return pages;
    } catch (err) {
      console.warn("Failed PDF rendering via pdfjs-dist, falling back to FileReader:", err);
    }
  }

  // Fallback or Direct Image File Handler (PNG, JPG, JPEG, WEBP)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve([
        {
          pageNumber: 1,
          dataUrl: reader.result as string,
        },
      ]);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
