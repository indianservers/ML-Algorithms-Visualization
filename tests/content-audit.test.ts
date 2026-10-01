import { describe, expect, it } from 'vitest';
import { getAllAlgorithms } from '../src/data/implementationStatus';
import { getLearningContent } from '../src/data/learningContent';
import { getLearnPageContent } from '../src/data/algorithmLearnTheory';
import { algorithmSearchMeta } from '../src/data/algorithmSearchMeta';

describe('algorithm learning content', () => {
  it('provides complete, usable lessons and quizzes for every registered route', () => {
    const algorithms = getAllAlgorithms();
    expect(algorithms.length).toBeGreaterThan(200);

    for (const algorithm of algorithms) {
      const content = getLearningContent(algorithm.route);
      const theory = getLearnPageContent(algorithm.route);
      expect(algorithmSearchMeta[algorithm.route]?.description.trim(), algorithm.route).toBeTruthy();
      expect(content.lessons.length, algorithm.route).toBeGreaterThan(0);
      expect(theory.idea.trim(), algorithm.route).not.toBe('');
      expect(content.formula.trim(), algorithm.route).not.toBe('');
      expect(JSON.stringify(content), algorithm.route).not.toMatch(/choose_model|run\.fit|transforms observed data into a useful representation/);

      for (const question of content.quiz) {
        expect(question.answer, algorithm.route).toBeGreaterThanOrEqual(0);
        expect(question.answer, algorithm.route).toBeLessThan(question.options.length);
        expect(question.options.every((option) => option.trim().length > 0 && !/\.{3}$|…$/.test(option)), algorithm.route).toBe(true);
      }
    }
  });

  it('uses the method implemented by pages with similar names', () => {
    const multiclass = getLearningContent('/ml/supervised/multinomial-logistic-regression');
    expect(multiclass.lessons[0].simpleExplanation).toMatch(/Softmax/);
    expect(multiclass.formula).toMatch(/Σⱼ/);
    expect(multiclass.lessons[0].simpleExplanation).not.toMatch(/yes-or-no/);

    const lda = getLearningContent('/ml/dimensionality-reduction/lda');
    expect(lda.lessons[0].simpleExplanation).toMatch(/Project/);
    expect(lda.formula).toMatch(/between-class scatter/);

    const boosting = getLearningContent('/ml/ensemble/boosting');
    expect(boosting.formula).toMatch(/AdaBoost/);
    expect(boosting.formula).toMatch(/misclassified/);

    expect(getLearningContent('/ml/reinforcement-learning/multi-armed-bandit').formula).toMatch(/observed rewards/);
    expect(getLearningContent('/ml/time-series/moving-average').formula).toMatch(/one-step-ahead/);
    expect(getLearningContent('/ai-algorithms/a-star-search').lessons[0].simpleExplanation).toMatch(/path cost and heuristic/);

    const logistic = getLearningContent('/ml/supervised/logistic-regression');
    expect(logistic.lessons[0].simpleExplanation).not.toMatch(/softmax/);
    expect(logistic.lessons[0].realtimeExample).toMatch(/spam or not spam/);

    const gaussian = getLearningContent('/ml/supervised/naive-bayes');
    expect(gaussian.quiz.find((question) => question.question.startsWith('Which real-world use'))?.options[0]).toMatch(/numeric petal/);
    expect(gaussian.quiz.find((question) => question.question.startsWith('Which setting should'))?.options[0]).toMatch(/Variance smoothing/);
    expect(gaussian.lessons[3].realtimeExample).toMatch(/largest posterior/);
  });
});
