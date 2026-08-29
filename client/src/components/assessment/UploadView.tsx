import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ArrowRight, FileText, Upload, X } from "lucide-react";
import type { RenderedPage, UploadKind } from "@/types/assessment";
import { processUploadFile } from "@/lib/pdf";

interface UploadViewProps {
  questionPages: RenderedPage[];
  questionFileName: string | null;
  questionFileSize: string | null;
  answerPages: RenderedPage[];
  answerFileName: string | null;
  answerFileSize: string | null;
  errorMessage: string | null;
  onQuestionUploaded: (pages: RenderedPage[], fileName: string, fileSize: string) => void;
  onAnswerUploaded: (pages: RenderedPage[], fileName: string, fileSize: string) => void;
  onQuestionRemoved: () => void;
  onAnswerRemoved: () => void;
  onStartMapping: () => void;
  onError: (msg: string | null) => void;
}

function FileTile({
  kind,
  fileName,
  fileSize,
  pageCount,
  onPick,
  onRemove,
  onDropFile,
}: {
  kind: UploadKind;
  fileName: string | null;
  fileSize?: string | null;
  pageCount?: number;
  onPick: (kind: UploadKind) => void;
  onRemove: () => void;
  onDropFile: (file: File, kind: UploadKind) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const label = kind === "question" ? "Question Paper" : "Answer Sheet";
  const pages = pageCount || 1;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onDropFile(file, kind);
    }
  };

  return (
    <div
      className={`file-tile ${fileName ? "has-file" : ""} ${isDragOver ? "is-dragover" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {fileName ? (
        <div className="selected-file">
          <div className="pdf-icon">
            <FileText size={18} />
          </div>
          <div className="selected-file__text">
            <strong title={fileName}>{fileName}</strong>
            <span>
              {fileSize || "1.2 MB"} &bull; {pages} Page{pages > 1 ? "s" : ""}
            </span>
          </div>
          <button
            className="remove-file"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            title={`Remove ${label}`}
          >
            <X size={13} strokeWidth={2.8} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="upload-prompt"
          onClick={() => onPick(kind)}
          aria-label={`Upload ${label}`}
        >
          <span className="upload-icon">
            <Upload size={24} />
          </span>
          <strong>
            Upload <span className="highlight-text">{label}</span>
          </strong>
          <small>Max 10MB</small>
        </button>
      )}
    </div>
  );
}

export function UploadView({
  questionPages,
  questionFileName,
  questionFileSize,
  answerPages,
  answerFileName,
  answerFileSize,
  errorMessage,
  onQuestionUploaded,
  onAnswerUploaded,
  onQuestionRemoved,
  onAnswerRemoved,
  onStartMapping,
  onError,
}: UploadViewProps) {
  const [activePicker, setActivePicker] = useState<UploadKind | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canStart = Boolean(questionPages.length > 0 && answerPages.length > 0);

  function triggerPicker(kind: UploadKind) {
    setActivePicker(kind);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  async function handleFile(file: File, kind: UploadKind) {
    try {
      onError(null);
      const rendered = await processUploadFile(file);
      const mb = file.size / (1024 * 1024);
      const sizeStr = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

      if (kind === "question") {
        onQuestionUploaded(rendered, file.name, sizeStr);
      } else {
        onAnswerUploaded(rendered, file.name, sizeStr);
      }
    } catch (err: any) {
      onError(`Could not process ${file.name}: ${err.message}`);
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activePicker) return;
    handleFile(file, activePicker);
  }

  return (
    <section className="upload-workspace">
      <div className="upload-title-block">
        <h1 className="desktop-only">
          <span>Upload</span> <mark>Question Paper &amp; Answer Sheets</mark>
        </h1>
        <h1 className="mobile-only mobile-upload-title">
          <span>Upload Question Paper</span>
          <span>&amp; Answer Sheets</span>
        </h1>
        <p className="desktop-only">
          Upload both files to automatically map handwritten answers to questions and evaluate scores
        </p>
      </div>

      <img
        className="teacher-orb"
        src="/girlbook.png"
        alt="AI teaching assistant holding assessment papers"
      />

      {errorMessage && (
        <div className="error-alert" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="upload-frame">
        <FileTile
          kind="question"
          fileName={questionFileName}
          fileSize={questionFileSize}
          pageCount={questionPages.length}
          onPick={triggerPicker}
          onRemove={onQuestionRemoved}
          onDropFile={(file, k) => handleFile(file, k)}
        />
        <FileTile
          kind="answer"
          fileName={answerFileName}
          fileSize={answerFileSize}
          pageCount={answerPages.length}
          onPick={triggerPicker}
          onRemove={onAnswerRemoved}
          onDropFile={(file, k) => handleFile(file, k)}
        />
      </div>

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
        onChange={onFileInputChange}
      />

      <button
        type="button"
        className={`mapping-cta ${canStart ? "is-enabled" : ""}`}
        onClick={canStart ? onStartMapping : undefined}
        disabled={!canStart}
      >
        Start Mapping <ArrowRight size={24} />
      </button>

      <p className="mapping-helper">
        Once both files are uploaded, you’ll be able to map answers with questions
      </p>
    </section>
  );
}
