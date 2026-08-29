import https from "node:https";

export interface HighlightRegion {
  top: string;
  height: string;
  left?: string;
  width?: string;
}

export interface ExtractedQuestion {
  id: string;
  number: string;
  text: string;
  score: string;
  maxScore: number;
  numericScore: number;
  tone: "good" | "partial" | "missed" | "unanswered";
  feedback: string;
  page: number;
  highlight: HighlightRegion | null;
  isAnswered: boolean;
  studentAnswerText?: string;
}

export interface UnmatchedAnswer {
  id: string;
  page: number;
  highlight: HighlightRegion;
  transcript: string;
  note: string;
}

export interface AssessmentResult {
  questions: ExtractedQuestion[];
  unmatchedAnswers: UnmatchedAnswer[];
  overall: {
    totalScore: number;
    totalMaxScore: number;
    percentage: number;
    summary: string;
  };
}

export interface PageFileData {
  data: string;
  mimeType: string;
  pageNumber: number;
}

export async function processAssessmentWithGemini(
  questionPages: PageFileData[],
  answerPages: PageFileData[],
  customApiKey?: string
): Promise<AssessmentResult> {
  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    "";
  if (!apiKey) {
    throw new Error(
      "Missing Gemini API Key. Please provide an API key or set GEMINI_API_KEY in your environment."
    );
  }
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  const parts: any[] = [];

  parts.push({
    text: [
      "You are an expert examination grading, answer mapping, and OCR evaluator for VedaAI.",
      "Analyze the provided Question Paper pages and handwritten Student Answer Sheet pages.",
      "",
      "CORE INSTRUCTIONS:",
      "1. QUESTION EXTRACTION:",
      "   - Extract EVERY question from the Question Paper in the exact printed order.",
      "   - Treat labelled sub-parts as separate question items (for example, 11(a) and 11(b) must be separate items with number '11 a.' and '11 b.').",
      "   - Preserve exact original question numbering and complete question text prompt.",
      "   - Estimate appropriate max marks (e.g. 2, 3, 5) if not explicitly given.",
      "",
      "2. ANSWER EXTRACTION & MAPPING:",
      "   - Carefully read the student's handwritten responses across all answer sheet pages.",
      "   - Map each handwritten answer to its matching question (even if written out of order or across multiple pages).",
      "   - If a question was NOT answered anywhere on the sheet, set isAnswered = false, score = '0 / 2', tone = 'missed', highlight = null, and feedback = 'Question was not attempted on the answer sheet.'",
      "   - If an answer is found on the answer sheet, compute its normalized bounding box percentage region on that specific page:",
      "     - top: percentage string (e.g. '12%')",
      "     - height: percentage string (e.g. '20%')",
      "     - left: percentage string (e.g. '3%')",
      "     - width: percentage string (e.g. '94%')",
      "     - page: 1-based page index of the answer sheet where this answer is located.",
      "",
      "3. GRADING & EVALUATION:",
      "   - Evaluate accuracy, conceptual depth, and completeness of the student's answer.",
      "   - Assign a realistic score (e.g. '4 / 5', '2 / 2', '1 / 3', '0 / 2').",
      "   - Set tone: 'good' if >= 75% marks, 'partial' if between 30% and 74% marks, 'missed' if < 30% marks or incorrect.",
      "   - Provide constructive, detailed pedagogical AI feedback explaining what was correct, any mistakes or misconceptions, and how to improve.",
      "",
      "4. UNMATCHED ANSWERS:",
      "   - If the student wrote answers or notes that do not correspond to any printed question in the paper, list them in unmatchedAnswers.",
      "",
      "5. OVERALL ASSESSMENT:",
      "   - Calculate totalScore, totalMaxScore, percentage, and write a summary paragraph of the student's overall performance.",
      "",
      "OUTPUT SCHEMA (JSON ONLY):",
      "{",
      '  "questions": [',
      "    {",
      '      "id": "q1",',
      '      "number": "1",',
      '      "text": "Question prompt text...",',
      '      "score": "2 / 2",',
      '      "maxScore": 2,',
      '      "numericScore": 2,',
      '      "tone": "good",',
      '      "feedback": "Detailed feedback...",',
      '      "page": 1,',
      '      "highlight": { "top": "8%", "height": "18%", "left": "3%", "width": "94%" },',
      '      "isAnswered": true,',
      '      "studentAnswerText": "Transcribed student handwritten answer..."',
      "    }",
      "  ],",
      '  "unmatchedAnswers": [],',
      '  "overall": {',
      '    "totalScore": 28,',
      '    "totalMaxScore": 35,',
      '    "percentage": 80,',
      '    "summary": "Overall assessment summary..."',
      "  }",
      "}",
    ].join("\n"),
  });

  questionPages.forEach((p, idx) => {
    parts.push({
      text:
        "--- QUESTION PAPER [Page " +
        (idx + 1) +
        " of " +
        questionPages.length +
        "] ---",
    });
    const cleanBase64 = p.data.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: p.mimeType || "image/png",
        data: cleanBase64,
      },
    });
  });

  answerPages.forEach((p, idx) => {
    parts.push({
      text:
        "--- STUDENT ANSWER SHEET [Page " +
        (idx + 1) +
        " of " +
        answerPages.length +
        "] ---",
    });
    const cleanBase64 = p.data.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: p.mimeType || "image/png",
        data: cleanBase64,
      },
    });
  });

  const payload = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 90000,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(
              new Error("Gemini API Error (" + res.statusCode + "): " + rawData)
            );
          }
          try {
            const parsed = JSON.parse(rawData);
            const candidate =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!candidate) {
              return reject(
                new Error("No response content received from Gemini model")
              );
            }
            const resultJson = JSON.parse(candidate);
            resolve(resultJson);
          } catch (err: any) {
            reject(
              new Error(
                "Failed to parse Gemini response: " +
                  err.message +
                  ". Raw: " +
                  rawData.slice(0, 500)
              )
            );
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Gemini API request timed out (90s)"));
    });

    req.write(payload);
    req.end();
  });
}
