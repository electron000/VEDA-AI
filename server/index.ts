import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { processAssessmentWithGemini } from "./gemini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Increase payload limit for base64 image data from multi-page PDFs
  app.use(express.json({ limit: "60mb" }));
  app.use(express.urlencoded({ limit: "60mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "VedaAI Assessment API", model: "gemini-2.5-flash" });
  });

  // AI Extraction & Assessment API endpoint
  app.post("/api/extract", async (req, res) => {
    try {
      const { questionPages, answerPages, apiKey } = req.body;

      if (!questionPages || !Array.isArray(questionPages) || questionPages.length === 0) {
        return res.status(400).json({ error: "Missing or invalid questionPages array" });
      }
      if (!answerPages || !Array.isArray(answerPages) || answerPages.length === 0) {
        return res.status(400).json({ error: "Missing or invalid answerPages array" });
      }

      const result = await processAssessmentWithGemini(questionPages, answerPages, apiKey);
      return res.json(result);
    } catch (error: any) {
      console.error("Extraction error:", error);
      return res.status(500).json({ error: error.message || "Failed to process assessment with Gemini" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
