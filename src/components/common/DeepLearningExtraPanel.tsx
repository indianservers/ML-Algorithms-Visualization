import { TopicQuickQuiz } from "./TopicQuickQuiz";
import { deepLearningQuestions } from "../../data/topicQuizQuestions";
import { getAlgorithmByRoute } from "../../data/implementationStatus";

export function DeepLearningExtraPanel({ tab, route }: { tab: string; route: string }) {
  if (tab === "Quick Quiz") {
    return <TopicQuickQuiz title={getAlgorithmByRoute(route)?.label ?? "Deep Learning"} questions={deepLearningQuestions[route] ?? []} />;
  }
  if (tab === "Inference") {
    return <section className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-100"><h2 className="font-bold">Live test / inference</h2><p>Change the current input below to inspect how the network responds. Train the model first where this lab offers model fitting.</p></section>;
  }
  return null;
}
