import "./LabPipeline.css";

export function LabPipeline({
  stages,
  active,
  onSelect,
  playing,
  onPlay,
  onPause,
  onStep,
  onReset,
  note,
}: {
  stages: string[];
  active: number;
  onSelect?: (index: number) => void;
  playing?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  note?: string;
}) {
  return (
    <div className="lab-pipeline">
      <div className="lab-pipeline-steps" role="tablist" aria-label="Pipeline stages">
        {stages.map((stage, index) => (
          <button
            type="button"
            key={stage}
            role="tab"
            aria-selected={active === index}
            className={active === index ? "active" : ""}
            onClick={() => onSelect?.(index)}
          >
            {index + 1}. {stage}
          </button>
        ))}
      </div>
      {(onPlay || onStep || onReset) && (
        <div className="lab-pipeline-play">
          {onPlay && onPause ? (
            <button type="button" onClick={playing ? onPause : onPlay}>
              {playing ? "Pause" : "Play"}
            </button>
          ) : null}
          {onStep ? (
            <button type="button" onClick={onStep}>
              Step
            </button>
          ) : null}
          {onReset ? (
            <button type="button" onClick={onReset}>
              Reset
            </button>
          ) : null}
        </div>
      )}
      {note ? <p className="lab-pipeline-note">{note}</p> : null}
    </div>
  );
}
