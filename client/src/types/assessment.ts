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

export interface AssessmentOverall {
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  summary: string;
}

export interface AssessmentResult {
  questions: ExtractedQuestion[];
  unmatchedAnswers: UnmatchedAnswer[];
  overall: AssessmentOverall;
}

export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
}

export type WorkflowStage = "upload" | "extracting" | "mapping";
export type UploadKind = "question" | "answer";
