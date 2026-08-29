/**
 * VedaAI - AI Assessment Extraction & Answer Mapping Platform
 * Production Architecture powered by Gemini 2.5 Flash
 */
import { useState } from "react";
import { CompactRail, LargeSidebar } from "@/components/common/Sidebar";
import { TopBar } from "@/components/common/TopBar";
import { UploadView } from "@/components/assessment/UploadView";
import { ExtractingView } from "@/components/assessment/ExtractingView";
import { MappingWorkspace } from "@/components/assessment/MappingWorkspace";
import { runAIAssessment } from "@/lib/gemini";
import type {
  AssessmentOverall,
  ExtractedQuestion,
  RenderedPage,
  UnmatchedAnswer,
  WorkflowStage,
} from "@/types/assessment";

export default function Home() {
  const [stage, setStage] = useState<WorkflowStage>("upload");
  const [stageIndex, setStageIndex] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Uploaded files data
  const [questionPages, setQuestionPages] = useState<RenderedPage[]>([]);
  const [answerPages, setAnswerPages] = useState<RenderedPage[]>([]);
  const [questionFileName, setQuestionFileName] = useState<string | null>(null);
  const [questionFileSize, setQuestionFileSize] = useState<string | null>(null);
  const [answerFileName, setAnswerFileName] = useState<string | null>(null);
  const [answerFileSize, setAnswerFileSize] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Assessment results
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [unmatchedAnswers, setUnmatchedAnswers] = useState<UnmatchedAnswer[]>([]);
  const [overall, setOverall] = useState<AssessmentOverall | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  // Trigger real AI extraction with Gemini 2.5 Flash
  async function beginExtraction() {
    if (questionPages.length === 0 || answerPages.length === 0) {
      setErrorMessage("Please upload both a Question Paper and an Answer Sheet.");
      return;
    }

    setStage("extracting");
    setStageIndex(0);
    setProgressMsg("Reading question paper & extracting questions...");
    setErrorMessage(null);

    try {
      const result = await runAIAssessment(
        questionPages,
        answerPages,
        (msg, idx) => {
          setProgressMsg(msg);
          setStageIndex(idx);
        }
      );

      if (result && result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        setUnmatchedAnswers(result.unmatchedAnswers || []);
        setOverall(result.overall || null);

        const firstQ = result.questions[0];
        setSelectedId(firstQ.id);
        setPage(firstQ.page || 1);
        setExpandedIds([firstQ.id]);
        setStage("mapping");
      } else {
        throw new Error("No questions were identified in the uploaded assessment.");
      }
    } catch (err: any) {
      console.error("AI assessment failed:", err);
      setErrorMessage(err.message || "Failed to process assessment with Gemini AI.");
      setStage("upload");
    }
  }

  function handleSelectQuestion(q: ExtractedQuestion) {
    setSelectedId(q.id);
    if (q.page) setPage(q.page);
    setExpandedIds((cur) => (cur.includes(q.id) ? cur : [...cur, q.id]));
  }

  function handleToggleQuestion(id: string) {
    setExpandedIds((cur) =>
      cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]
    );
  }

  function handleToggleAll() {
    if (expandedIds.length === questions.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(questions.map((q) => q.id));
    }
  }

  function handleReset() {
    setStage("upload");
    setErrorMessage(null);
  }

  return (
    <div className={`app-shell ${stage}-shell`}>
      {sidebarExpanded ? (
        <LargeSidebar onToggle={() => setSidebarExpanded(false)} />
      ) : (
        <CompactRail onToggle={() => setSidebarExpanded(true)} />
      )}

      <main className={`content-shell ${stage}-content`}>
        <TopBar
          compact={stage === "extracting"}
          onReset={stage !== "upload" ? handleReset : undefined}
        />

        {stage === "upload" && (
          <UploadView
            questionPages={questionPages}
            questionFileName={questionFileName}
            questionFileSize={questionFileSize}
            answerPages={answerPages}
            answerFileName={answerFileName}
            answerFileSize={answerFileSize}
            errorMessage={errorMessage}
            onQuestionUploaded={(pages, name, size) => {
              setQuestionPages(pages);
              setQuestionFileName(name);
              setQuestionFileSize(size);
            }}
            onAnswerUploaded={(pages, name, size) => {
              setAnswerPages(pages);
              setAnswerFileName(name);
              setAnswerFileSize(size);
            }}
            onQuestionRemoved={() => {
              setQuestionPages([]);
              setQuestionFileName(null);
              setQuestionFileSize(null);
            }}
            onAnswerRemoved={() => {
              setAnswerPages([]);
              setAnswerFileName(null);
              setAnswerFileSize(null);
            }}
            onStartMapping={beginExtraction}
            onError={setErrorMessage}
          />
        )}

        {stage === "extracting" && (
          <ExtractingView
            progressMsg={progressMsg}
            stageIndex={stageIndex}
          />
        )}

        {stage === "mapping" && (
          <MappingWorkspace
            questions={questions}
            unmatchedAnswers={unmatchedAnswers}
            overall={overall}
            selectedId={selectedId}
            expandedIds={expandedIds}
            page={page}
            zoom={zoom}
            answerPages={answerPages}
            onSelectQuestion={handleSelectQuestion}
            onToggleQuestion={handleToggleQuestion}
            onToggleAll={handleToggleAll}
            onSetPage={setPage}
            onSetZoom={setZoom}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
