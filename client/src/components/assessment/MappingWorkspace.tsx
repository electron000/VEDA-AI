import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  AssessmentOverall,
  ExtractedQuestion,
  RenderedPage,
  UnmatchedAnswer,
} from "@/types/assessment";

interface MappingWorkspaceProps {
  questions: ExtractedQuestion[];
  unmatchedAnswers: UnmatchedAnswer[];
  overall: AssessmentOverall | null;
  selectedId: string;
  expandedIds: string[];
  page: number;
  zoom: number;
  answerPages: RenderedPage[];
  onSelectQuestion: (question: ExtractedQuestion) => void;
  onToggleQuestion: (id: string) => void;
  onToggleAll: () => void;
  onSetPage: (page: number) => void;
  onSetZoom: (zoom: number | ((prev: number) => number)) => void;
  onReset: () => void;
}

function ScoreChip({ question }: { question: ExtractedQuestion }) {
  let toneClass = "score-chip--good";
  if (!question.isAnswered || question.tone === "unanswered") {
    toneClass = "score-chip--unanswered";
  } else if (question.tone === "missed") {
    toneClass = "score-chip--missed";
  } else if (question.tone === "partial") {
    toneClass = "score-chip--partial";
  }

  const displayText = !question.isAnswered
    ? "Unanswered"
    : question.score || `${question.numericScore} / ${question.maxScore}`;

  return <span className={`score-chip ${toneClass}`}>{displayText}</span>;
}

function AnswerPreview({
  selected,
  page,
  zoom,
  answerPages,
  onHighlightClick,
}: {
  selected: ExtractedQuestion | undefined;
  page: number;
  zoom: number;
  answerPages: RenderedPage[];
  onHighlightClick?: () => void;
}) {
  const isMatchOnThisPage = selected && selected.page === page && selected.highlight;
  const currentPageData = answerPages.find((p) => p.pageNumber === page);

  return (
    <div
      className="answer-canvas"
      style={{ "--sheet-scale": zoom / 100 } as React.CSSProperties}
    >
      {currentPageData ? (
        <img
          src={currentPageData.dataUrl}
          alt={`Student handwritten answer sheet page ${page}`}
          className="answer-sheet-image"
        />
      ) : (
        <div className="paper-fallback">
          <div className="paper-line-grid" />
          <div className="p-8 text-center text-stone-500">
            Page {page} preview loading...
          </div>
        </div>
      )}

      {isMatchOnThisPage && selected && selected.highlight && (
        <div
          className="answer-highlight"
          style={{
            top: selected.highlight.top,
            height: selected.highlight.height,
            left: selected.highlight.left || "3%",
            width: selected.highlight.width || "94%",
          }}
          onClick={onHighlightClick}
          title={`Click to focus question ${selected.number}`}
        >
          <span>Q{selected.number.replace(/[^0-9a-zA-Z]/g, "")}</span>
        </div>
      )}
    </div>
  );
}

export function MappingWorkspace({
  questions,
  unmatchedAnswers,
  overall,
  selectedId,
  expandedIds,
  page,
  zoom,
  answerPages,
  onSelectQuestion,
  onToggleQuestion,
  onToggleAll,
  onSetPage,
  onSetZoom,
  onReset,
}: MappingWorkspaceProps) {
  const [mobilePanel, setMobilePanel] = useState<"questions" | "answers">("questions");

  const selected = useMemo(() => {
    return questions.find((q) => q.id === selectedId) || questions[0];
  }, [questions, selectedId]);

  const totalPages = useMemo(() => {
    return Math.max(answerPages.length, 1);
  }, [answerPages]);

  const allExpanded = expandedIds.length === questions.length && questions.length > 0;

  return (
    <>
      <div className="mobile-map-toggle" role="tablist" aria-label="Mapping view">
        <button
          className={mobilePanel === "questions" ? "is-active" : ""}
          onClick={() => setMobilePanel("questions")}
        >
          Questions ({questions.length})
        </button>
        <button
          className={mobilePanel === "answers" ? "is-active" : ""}
          onClick={() => setMobilePanel("answers")}
        >
          Answer Sheet (Page {page})
        </button>
      </div>

      <section className="mapping-workspace">
        {/* Left Pane: Extracted Questions */}
        <div
          className={`question-pane ${mobilePanel === "questions" ? "mobile-current" : ""}`}
        >
          <div className="pane-head">
            <h2>
              Extracted Questions <span>(from question paper)</span>
            </h2>
            <button onClick={onToggleAll}>
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {overall && (
            <div className="overall-summary-card">
              <div className="summary-score">
                <Sparkles size={18} className="text-[#ff5a2f]" />
                <strong>
                  Score: {overall.totalScore} / {overall.totalMaxScore}
                </strong>
                <span>({overall.percentage}%)</span>
              </div>
              <p>{overall.summary}</p>
            </div>
          )}

          <div className="question-scroll">
            {questions.map((question) => {
              const isOpen = expandedIds.includes(question.id);
              const isSelected = selectedId === question.id;

              return (
                <article
                  key={question.id}
                  className={`question-card ${isSelected ? "is-selected" : ""} ${
                    isOpen ? "is-open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="question-card__summary"
                    onClick={() => onSelectQuestion(question)}
                  >
                    <span className="question-number">{question.number}</span>
                    <span className="question-copy">{question.text}</span>
                    <ScoreChip question={question} />
                  </button>

                  <button
                    type="button"
                    className="question-chevron"
                    aria-label={`Toggle feedback for question ${question.number}`}
                    onClick={() => onToggleQuestion(question.id)}
                  >
                    <ChevronDown
                      size={21}
                      className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
                    />
                  </button>

                  {isOpen && (
                    <div className="feedback-panel">
                      <h3>AI Feedback</h3>
                      <p>
                        {question.feedback ||
                          "Answer evaluated against standard marking criteria."}
                      </p>

                      {question.studentAnswerText && (
                        <div className="student-transcription">
                          <strong>Transcribed Student Answer:</strong>
                          <p>"{question.studentAnswerText}"</p>
                        </div>
                      )}

                      {question.isAnswered && (
                        <button
                          type="button"
                          className="show-answer"
                          onClick={() => {
                            onSelectQuestion(question);
                            setMobilePanel("answers");
                          }}
                        >
                          Show highlighted answer <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {unmatchedAnswers && unmatchedAnswers.length > 0 && (
              <div className="unmatched-card">
                <h3>Unmatched Handwritten Work ({unmatchedAnswers.length})</h3>
                {unmatchedAnswers.map((u) => (
                  <div
                    key={u.id}
                    className="unmatched-item"
                    onClick={() => onSetPage(u.page)}
                    title={`Jump to page ${u.page}`}
                  >
                    <span>Page {u.page}:</span> <p>"{u.transcript}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Answer Sheet Viewer */}
        <div
          className={`answer-pane ${mobilePanel === "answers" ? "mobile-current" : ""}`}
        >
          <div className="answer-toolbar">
            <strong>Answer Sheet</strong>
            <div className="viewer-controls">
              <div className="zoom-control">
                <button
                  type="button"
                  onClick={() => onSetZoom((v) => Math.max(70, v - 10))}
                  aria-label="Zoom out"
                >
                  <Minus size={17} />
                </button>
                <span>{zoom}%</span>
                <button
                  type="button"
                  onClick={() => onSetZoom((v) => Math.min(130, v + 10))}
                  aria-label="Zoom in"
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className="page-control">
                <button
                  type="button"
                  onClick={() => onSetPage(Math.max(1, page - 1))}
                  aria-label="Previous page"
                  disabled={page <= 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  Page {page} of {totalPages}
                </strong>
                <button
                  type="button"
                  onClick={() => onSetPage(Math.min(totalPages, page + 1))}
                  aria-label="Next page"
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                type="button"
                className="reset-assessment-btn"
                onClick={onReset}
                title="Upload new assessment"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="sheet-viewport">
            <AnswerPreview
              selected={selected}
              page={page}
              zoom={zoom}
              answerPages={answerPages}
            />
          </div>
        </div>
      </section>
    </>
  );
}
