import { BarChart3, BookOpen, BrainCircuit, Play, Send } from "lucide-react";
import "./LearningStageTabs.css";

const LEARNING_STAGES = ["Learn", "Visualize", "Train", "Inference", "Quick Quiz"] as const;
export type LearningStage = (typeof LEARNING_STAGES)[number];

const icon = {
  Learn: BookOpen,
  Visualize: BarChart3,
  Train: Play,
  Inference: Send,
  "Quick Quiz": BrainCircuit,
};

export function LearningStageTabs({ value, onChange, stages = LEARNING_STAGES }: {
  value: LearningStage;
  onChange: (stage: LearningStage) => void;
  stages?: readonly LearningStage[];
}) {
  return (
    <nav className="learning-stage-tabs" role="tablist" aria-label="Learning stages">
      {stages.map((stage) => {
        const Icon = icon[stage];
        return <button key={stage} type="button" role="tab" aria-selected={value === stage} onClick={() => onChange(stage)}><Icon size={18} aria-hidden="true" />{stage}</button>;
      })}
    </nav>
  );
}
