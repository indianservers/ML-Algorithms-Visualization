import { useState } from "react";
import "./TopicQuickQuiz.css";

export type QuizQuestion = { prompt: string; choices: [string, string, string]; answer: number; explanation: string };

export function TopicQuickQuiz({ title, questions }: { title: string; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = Object.keys(answers).length;
  const score = questions.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0);
  return <section className="topic-quick-quiz" aria-label={`${title} quick quiz`}>
    <header><h2>Quick Quiz</h2><p>Check the idea, then return to the lab to test it.</p></header>
    {questions.map((item, index) => <fieldset key={item.prompt}>
      <legend>{index + 1}. {item.prompt}</legend>
      {item.choices.map((choice, choiceIndex) => <label key={choice} className={answers[index] === choiceIndex ? "chosen" : ""}>
        <input type="radio" name={`${title}-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: choiceIndex }))} />{choice}
      </label>)}
      {answers[index] !== undefined && <p className={answers[index] === item.answer ? "correct" : "incorrect"}>{answers[index] === item.answer ? "Correct. " : "Try again. "}{item.explanation}</p>}
    </fieldset>)}
    <p className="topic-quick-quiz-score" role="status">{answered === questions.length ? `${score} of ${questions.length} correct` : `${answered} of ${questions.length} answered`}</p>
    <button type="button" onClick={() => setAnswers({})}>Try again</button>
  </section>;
}
