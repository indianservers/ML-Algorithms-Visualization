import { learningContent } from './learningCatalog';

export type QTransition = { state: number; action: number; next: number; reward: number; oldQ: number; nextQ: number; target: number; tdError: number; newQ: number; terminal: boolean; updated: boolean };
export type QSnapshot = { episode: number; completed: number; state: number; action: number | null; phase: string; steps: number; totalReward: number; epsilon: number; exploring: boolean; transition: QTransition | null; history: { episode: number; reward: number; steps: number; success: boolean }[]; q: number[][]; done: boolean; event: string; config: QConfig; environment: GridEnvironment; policy: (number | null)[]; route: number[]; routeGoal: boolean; routeReason?: string };
export type QConfig = { epsilon: number; alpha: number; gamma: number; episodes: number; maxSteps: number; rewardMode: string; preset: string };
export type GridEnvironment = { size: number; start: number; goal: number; walls: number[]; penalties: number[]; stepReward?: number; penaltyReward?: number; goalReward?: number };
export type RunSummary = { algorithm: 'qlearning' | 'sarsa'; seed: number; config: QConfig; environment: GridEnvironment; completed: number; history: { episode: number; reward: number; steps: number; success: boolean }[]; averageReward: number; successRate: number; route: number[]; routeGoal: boolean; routeReason?: string; q: number[][] };
export type Experiment = { id: string; slug: string; savedAt: number; title: string; seed: number; parameter: string; baseline: RunSummary; variant?: RunSummary };
export type Notebook = { prediction: string; observation: string; conclusion: string };
export type LabRecord = { actions: number; attempts: number; correct: number; quizPassed: boolean; predictions: number; calculations: number; challengePassed: boolean; lastVisit: number; dueAt: number; notebook: Notebook };
export type ConceptRecord = { correct: number; attempts: number; dueAt: number };
export type LearningStore = { version: 1; labs: Record<string, LabRecord>; concepts: Record<string, ConceptRecord>; experiments: Experiment[] };
export type Assignment = { slug: string; title: string; target: string; due: string };

const storageKey = 'ai-virtual-labs-learning-v1';
const emptyNotebook = (): Notebook => ({ prediction: '', observation: '', conclusion: '' });
export const emptyLabRecord = (): LabRecord => ({ actions: 0, attempts: 0, correct: 0, quizPassed: false, predictions: 0, calculations: 0, challengePassed: false, lastVisit: 0, dueAt: 0, notebook: emptyNotebook() });
export const emptyLearningStore = (): LearningStore => ({ version: 1, labs: {}, concepts: {}, experiments: [] });

export function readLearningStore(): LearningStore {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return emptyLearningStore();
    const parsed = JSON.parse(raw) as LearningStore;
    return parsed.version === 1 && parsed.labs && parsed.concepts && Array.isArray(parsed.experiments) ? parsed : emptyLearningStore();
  } catch { return emptyLearningStore(); }
}
export function writeLearningStore(store: LearningStore) {
  try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch { /* Learning remains available when storage is full or disabled. */ }
}
export function labRecord(store: LearningStore, slug: string): LabRecord { return store.labs[slug] ?? emptyLabRecord(); }
export function labComplete(record: LabRecord, slug: string) { return record.quizPassed && (slug === 'q-learning' ? record.calculations > 0 : record.actions >= 2); }
export function masteryLabel(store: LearningStore, concept: string) {
  const record = store.concepts[concept];
  if (!record?.attempts) return 'New';
  if (record.correct >= 3 && record.correct / record.attempts >= .75) return 'Strong';
  if (record.correct >= 1) return 'Practicing';
  return 'Review';
}
export function nextReviewAt(correctCount: number, now = Date.now()) {
  const days = correctCount <= 0 ? 1 : [1, 3, 7, 14][Math.min(correctCount - 1, 3)];
  return now + days * 86400000;
}
export function answerCheck(store: LearningStore, slug: string, correct: boolean, now = Date.now()): LearningStore {
  const content = learningContent(slug), prior = labRecord(store, slug), attempts = prior.attempts + 1, score = prior.correct + Number(correct), dueAt = nextReviewAt(score, now);
  const concepts = { ...store.concepts };
  for (const concept of content.concepts) {
    const old = concepts[concept] ?? { correct: 0, attempts: 0, dueAt: 0 };
    concepts[concept] = { correct: old.correct + Number(correct), attempts: old.attempts + 1, dueAt: nextReviewAt(old.correct + Number(correct), now) };
  }
  return { ...store, labs: { ...store.labs, [slug]: { ...prior, attempts, correct: score, quizPassed: prior.quizPassed || correct, dueAt, lastVisit: now } }, concepts };
}
export function recordAction(store: LearningStore, slug: string, now = Date.now()): LearningStore {
  const prior = labRecord(store, slug);
  return { ...store, labs: { ...store.labs, [slug]: { ...prior, actions: prior.actions + 1, lastVisit: now } } };
}
export function updateLabRecord(store: LearningStore, slug: string, patch: Partial<LabRecord>): LearningStore {
  return { ...store, labs: { ...store.labs, [slug]: { ...labRecord(store, slug), ...patch } } };
}
export function dueLabs(store: LearningStore, now = Date.now()) {
  return Object.entries(store.labs).filter(([, record]) => record.attempts > 0 && record.dueAt <= now).map(([slug]) => slug);
}
export function encodeShare(value: object): string {
  return btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)), (byte) => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeShare<T>(value: string | null): T | null {
  if (!value || value.length > 16000) return null;
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch { return null; }
}
