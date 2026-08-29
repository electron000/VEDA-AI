import type { AssessmentResult, RenderedPage } from "@/types/assessment";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

/**
 * Runs end-to-end AI Assessment analysis using Gemini 2.5 Flash.
 * Transcribes handwritten answers, maps each answer to questions,
 * calculates bounding box regions on specific pages, and generates pedagogical feedback.
 */
export async function runAIAssessment(
  questionPages: RenderedPage[],
  answerPages: RenderedPage[],
  onProgress?: (step: string, stepIndex: number) => void
): Promise<AssessmentResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini API Key. Please set VITE_GEMINI_API_KEY in your .env file."
    );
  }
  if (!questionPages || questionPages.length === 0) {
    throw new Error("Please provide at least one Question Paper page.");
  }
  if (!answerPages || answerPages.length === 0) {
    throw new Error("Please provide at least one Student Answer Sheet page.");
  }

  onProgress?.("Reading question paper & extracting questions...", 0);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
      "OUTPUT SCHEMA (STRICT JSON ONLY - NO MARKDOWN FENCES):",
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
      text: `--- QUESTION PAPER [Page ${idx + 1} of ${questionPages.length}] ---`,
    });
    const cleanBase64 = p.dataUrl.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64,
      },
    });
  });

  onProgress?.("Recognising handwritten answers...", 1);

  answerPages.forEach((p, idx) => {
    parts.push({
      text: `--- STUDENT ANSWER SHEET [Page ${idx + 1} of ${answerPages.length}] ---`,
    });
    const cleanBase64 = p.dataUrl.replace(/^data:[^;]+;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64,
      },
    });
  });

  onProgress?.("Mapping answer regions...", 2);

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  onProgress?.("Preparing grading insights...", 3);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response returned from Gemini API");
  }

  try {
    const parsed: AssessmentResult = JSON.parse(text);
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to parse AI assessment response: ${err.message}`);
  }
}
