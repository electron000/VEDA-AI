export const extractionSteps = [
  "Reading question paper & extracting questions",
  "Recognising handwritten answers",
  "Mapping answer regions",
  "Preparing grading insights",
];

interface ExtractingViewProps {
  progressMsg: string;
  stageIndex: number;
}

export function ExtractingView({ progressMsg, stageIndex }: ExtractingViewProps) {
  return (
    <section className="extraction-card">
      <div className="extract-center">
        <div className="spark-orbit">
          <img
            src="/extracting_icon.png"
            alt="Extracting..."
            className="extract-star-icon"
          />
        </div>
        <h1>
          Extracting<span className="loading-dots">...</span>
        </h1>
        <p>{progressMsg || extractionSteps[stageIndex] || "Analyzing documents..."}</p>

        <div
          className="stepper"
          aria-label={`Processing step ${stageIndex + 1} of ${extractionSteps.length}`}
        >
          {extractionSteps.map((step, index) => (
            <span
              key={step}
              className={index <= stageIndex ? "is-complete" : ""}
              title={step}
            />
          ))}
        </div>
        <small>Gemini 2.5 Flash is analyzing your assessment papers</small>
      </div>
    </section>
  );
}
