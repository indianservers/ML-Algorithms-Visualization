import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, ChevronDown, ClipboardList, GraduationCap, Lightbulb, Play, RotateCcw, Save, Share2, Volume2 } from 'lucide-react';
import type { AiVirtualLab } from './catalog';
import { aiVirtualLabs, aiVirtualLabRoute } from './catalog';
import { learningContent } from './learningCatalog';
import { theoryContent } from './theoryCatalog';
import { answerCheck, decodeShare, dueLabs, encodeShare, labComplete, labRecord, masteryLabel, updateLabRecord, type Assignment, type Experiment, type GridEnvironment, type LearningStore, type QConfig, type QSnapshot, type RunSummary } from './learningModel';
import './LearningCompanion.css';

type Tab = 'learn' | 'guide' | 'practice' | 'explore' | 'notebook' | 'progress' | 'educator';
type SandboxOptions = { algorithm?: 'qlearning' | 'sarsa'; config?: Partial<QConfig>; seed?: number; episodes?: number; maxSteps?: number; environment?: GridEnvironment };
type LearningWindow = Window & { AiLearningSandbox?: { run: (options?: SandboxOptions) => RunSummary }; AiLearningLive?: { snapshot: () => QSnapshot; step: () => void; pause: () => void } };
type SharedRun = { kind: 'experiment'; slug: string; seed: number; config: QConfig; environment?: GridEnvironment };
const actions = ['Up', 'Right', 'Down', 'Left'];
const diagnosticQuestions = [
  { prompt: 'An agent moves right and receives −1. Which part is the reward?', options: ['Moving right', '−1', 'The current grid cell'], answer: 1 },
  { prompt: 'If the next value is 4 and γ = 0.5, what is the discounted next value?', options: ['2', '4', '8'], answer: 0 },
  { prompt: 'What does Q-learning use for the next-state target?', options: ['The value of its chosen next action', 'The maximum next-action value', 'The average reward'], answer: 1 },
];
const fieldNames: Record<'epsilon' | 'alpha' | 'gamma', string> = { epsilon: 'Exploration rate ε', alpha: 'Learning rate α', gamma: 'Discount factor γ' };

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function asDate(value: number) { return new Date(value).toLocaleDateString(); }
function strength(record: { correct: number; attempts: number }) { return record.attempts ? `${Math.round(record.correct / record.attempts * 100)}%` : 'New'; }
function averageLast(history: RunSummary['history']) { const last = history.slice(-10); return last.length ? last.reduce((sum, item) => sum + item.reward, 0) / last.length : 0; }
function resultReason(run: RunSummary) { return run.routeGoal ? 'The greedy route reaches the goal.' : run.routeReason === 'cycle' ? 'The greedy route loops; exploration or more episodes may help.' : `The greedy route ends at ${run.routeReason || 'an unresolved state'}.`; }
function RunGrid({ run }: { run: RunSummary }) {
  const { environment, route } = run;
  return <div className="ai-learn-run-grid" style={{ gridTemplateColumns: `repeat(${environment.size}, minmax(0, 1fr))` }} role="img" aria-label={`${run.algorithm} route ${route.map((cell) => `row ${Math.floor(cell / environment.size) + 1} column ${cell % environment.size + 1}`).join(' to ')}. ${resultReason(run)}`}>
    {Array.from({ length: environment.size * environment.size }, (_, cell) => <span key={cell} className={cell === environment.start ? 'start' : cell === environment.goal ? 'goal' : environment.walls.includes(cell) ? 'wall' : environment.penalties.includes(cell) ? 'penalty' : route.includes(cell) ? 'route' : ''} aria-hidden="true">{cell === environment.start ? 'S' : cell === environment.goal ? '★' : environment.walls.includes(cell) ? '■' : environment.penalties.includes(cell) ? '−' : route.includes(cell) ? '•' : ''}</span>)}
  </div>;
}

export function LearningCompanion({ lab, snapshot, timeline, frameRef, store, setStore }: { lab: AiVirtualLab; snapshot: QSnapshot | null; timeline: QSnapshot[]; frameRef: React.RefObject<HTMLIFrameElement | null>; store: LearningStore; setStore: React.Dispatch<React.SetStateAction<LearningStore>> }) {
  const slug = lab.slug, content = learningContent(slug), theory = theoryContent(slug), record = labRecord(store, slug), q = slug === 'q-learning';
  const [open, setOpen] = React.useState(true);
  const [tab, setTab] = React.useState<Tab>('learn');
  const [selectedAnswer, setSelectedAnswer] = React.useState(-1);
  const [answerFeedback, setAnswerFeedback] = React.useState('');
  const [missionStart, setMissionStart] = React.useState(0);
  const [prediction, setPrediction] = React.useState(-1);
  const [predictionFeedback, setPredictionFeedback] = React.useState('');
  const [calculation, setCalculation] = React.useState('');
  const [calculationFeedback, setCalculationFeedback] = React.useState('');
  const [showWorked, setShowWorked] = React.useState(record.calculations === 0);
  const [replayIndex, setReplayIndex] = React.useState(-1);
  const [playing, setPlaying] = React.useState(false);
  const [parameter, setParameter] = React.useState<'epsilon' | 'alpha' | 'gamma'>('epsilon');
  const [variant, setVariant] = React.useState(.05);
  const [seed, setSeed] = React.useState(2026);
  const [comparison, setComparison] = React.useState<{ baseline: RunSummary; variant: RunSummary } | null>(null);
  const [challenge, setChallenge] = React.useState<RunSummary | null>(null);
  const [transfer, setTransfer] = React.useState<RunSummary | null>(null);
  const [custom, setCustom] = React.useState<RunSummary | null>(null);
  const [grid, setGrid] = React.useState<GridEnvironment>({ size: 5, start: 0, goal: 24, walls: [6, 17], penalties: [8, 21] });
  const [editMode, setEditMode] = React.useState<'wall' | 'penalty' | 'goal' | 'erase'>('wall');
  const [message, setMessage] = React.useState('');
  const [diagnostic, setDiagnostic] = React.useState([-1, -1, -1]);
  const [recommendation, setRecommendation] = React.useState('');
  const [assignmentTitle, setAssignmentTitle] = React.useState(`${lab.title} investigation`);
  const [assignmentDue, setAssignmentDue] = React.useState('');
  const [assignmentTarget, setAssignmentTarget] = React.useState<'completion' | 'challenge'>('completion');
  const [assignmentLink, setAssignmentLink] = React.useState('');
  const [educatorReports, setEducatorReports] = React.useState<{ name: string; concepts: LearningStore['concepts']; labs: LearningStore['labs'] }[]>([]);
  const [speechOn, setSpeechOn] = React.useState(false);
  const [today] = React.useState(() => Date.now());
  const shared = React.useMemo(() => decodeShare<SharedRun>(new URLSearchParams(location.search).get('learn')), []);
  const assigned = React.useMemo(() => decodeShare<Assignment>(new URLSearchParams(location.search).get('assignment')), []);
  const learningWindow = () => frameRef.current?.contentWindow as LearningWindow | null;
  const runSandbox = (options: SandboxOptions) => {
    const sandbox = learningWindow()?.AiLearningSandbox;
    if (!sandbox) { setMessage('The Q-learning lab is still loading. Try again once the simulator appears.'); return null; }
    try { setMessage(''); return sandbox.run(options); } catch { setMessage('This experiment could not run. Check the grid and try again.'); return null; }
  };
  const baseConfig = snapshot?.config ?? { epsilon: .2, alpha: .5, gamma: .9, episodes: 50, maxSteps: 100, rewardMode: 'standard', preset: 'classic' };
  const currentEvent = replayIndex >= 0 && replayIndex < timeline.length ? timeline[replayIndex] : snapshot;
  const reviewed = dueLabs(store, today);
  const missedConcepts = Object.entries(educatorReports.reduce<Record<string, { missed: number; attempts: number }>>((totals, report) => {
    for (const [concept, progress] of Object.entries(report.concepts)) {
      const row = totals[concept] ?? { missed: 0, attempts: 0 };
      row.missed += progress.attempts - progress.correct;
      row.attempts += progress.attempts;
      totals[concept] = row;
    }
    return totals;
  }, {})).sort(([, a], [, b]) => b.missed - a.missed);

  React.useEffect(() => {
    if (!playing || replayIndex < 0 || replayIndex >= timeline.length - 1) return;
    const timer = window.setTimeout(() => setReplayIndex((index) => index + 1), 750);
    return () => window.clearTimeout(timer);
  }, [playing, replayIndex, timeline.length]);

  const assess = () => {
    if (selectedAnswer < 0) return;
    const correct = selectedAnswer === content.check.answer;
    setAnswerFeedback(`${correct ? 'Correct. ' : 'Try again. '}${content.check.explanation}`);
    setStore((old) => answerCheck(old, slug, correct));
  };
  const predictAndStep = () => {
    const live = learningWindow()?.AiLearningLive;
    if (!live || prediction < 0) { setPredictionFeedback('Choose an action after the simulator loads.'); return; }
    if (live.snapshot().phase !== 'initialize') { setPredictionFeedback('Use Reset or finish this transition, then predict the next action.'); return; }
    live.step();
    const result = live.snapshot();
    const correct = result.action === prediction;
    setPredictionFeedback(`The agent chose ${actions[result.action ?? 0]}${result.exploring ? ' while exploring' : ' while exploiting'}. ${correct ? 'Your prediction matched.' : 'An ε-greedy choice can differ from the displayed best arrow; equal Q values also break ties.'}`);
    if (correct) setStore((old) => updateLabRecord(old, slug, { predictions: labRecord(old, slug).predictions + 1 }));
  };
  const checkCalculation = () => {
    const transition = snapshot?.transition;
    if (!transition || !Number.isFinite(Number(calculation)) || !calculation.trim()) { setCalculationFeedback('Wait for a transition, then enter a number.'); return; }
    const correct = Math.abs(Number(calculation) - transition.newQ) <= .011;
    const hint = Math.abs(Number(calculation) - transition.target) <= .011 ? 'You entered the target. Add α × (target − old Q) to old Q.' : `Check old Q (${transition.oldQ.toFixed(2)}), reward (${transition.reward.toFixed(2)}), next Q (${transition.nextQ.toFixed(2)}), α (${baseConfig.alpha}), and γ (${baseConfig.gamma}).`;
    setCalculationFeedback(correct ? `Correct: the new Q value is ${transition.newQ.toFixed(3)}.` : hint);
    if (correct) { setStore((old) => updateLabRecord(old, slug, { calculations: labRecord(old, slug).calculations + 1 })); setShowWorked(false); }
  };
  const compare = () => {
    const common = { seed, episodes: 50, maxSteps: 100 };
    const baseline = runSandbox({ ...common, config: baseConfig });
    const changed = runSandbox({ ...common, config: { ...baseConfig, [parameter]: variant } });
    if (baseline && changed) setComparison({ baseline, variant: changed });
  };
  const runChallenge = () => {
    const result = runSandbox({ seed, episodes: 50, maxSteps: 100, config: baseConfig });
    if (!result) return;
    setChallenge(result);
    if (result.routeGoal && result.route.every((cell) => !result.environment.penalties.includes(cell))) setStore((old) => updateLabRecord(old, slug, { challengePassed: true }));
  };
  const compareSarsa = () => {
    const baseline = runSandbox({ algorithm: 'qlearning', seed, episodes: 50, maxSteps: 100, config: { ...baseConfig, rewardMode: 'risky' } });
    const variantRun = runSandbox({ algorithm: 'sarsa', seed, episodes: 50, maxSteps: 100, config: { ...baseConfig, rewardMode: 'risky' } });
    if (baseline && variantRun) setComparison({ baseline, variant: variantRun });
  };
  const runCustom = (environment: GridEnvironment, destination: 'custom' | 'transfer') => {
    const result = runSandbox({ seed, episodes: 50, maxSteps: 100, config: baseConfig, environment });
    if (destination === 'custom') setCustom(result); else setTransfer(result);
  };
  const cycleCell = (cell: number) => {
    if (cell === grid.start) return;
    setGrid((old) => {
      const walls = old.walls.filter((item) => item !== cell), penalties = old.penalties.filter((item) => item !== cell);
      if (editMode === 'goal') return { ...old, goal: cell, walls, penalties };
      if (cell === old.goal) return old;
      if (editMode === 'wall') return { ...old, walls: [...walls, cell], penalties };
      if (editMode === 'penalty') return { ...old, walls, penalties: [...penalties, cell] };
      return { ...old, walls, penalties };
    });
  };
  const saveRun = (baseline: RunSummary, variantRun?: RunSummary) => {
    const experiment: Experiment = { id: crypto.randomUUID(), slug, savedAt: Date.now(), title: `${lab.title} · ${variantRun ? 'comparison' : 'run'}`, seed, parameter, baseline, variant: variantRun };
    setStore((old) => ({ ...old, experiments: [experiment, ...old.experiments].slice(0, 40) }));
    setMessage('Experiment saved in this browser.');
  };
  const shareRun = async (run: RunSummary) => {
    const code = encodeShare({ kind: 'experiment', slug, seed: run.seed, config: run.config, environment: run.environment } satisfies SharedRun);
    const url = `${location.origin}${aiVirtualLabRoute(slug)}?learn=${code}`;
    try { await navigator.clipboard.writeText(url); setMessage('Share link copied. Opening it reruns the same configuration and seed.'); }
    catch { setMessage(url); }
  };
  const narrative = snapshot ? `Episode ${snapshot.episode}, step ${snapshot.steps}. Agent at state ${Math.floor(snapshot.state / snapshot.environment.size) + 1}, ${snapshot.state % snapshot.environment.size + 1}. ${snapshot.event} ${snapshot.transition ? `Reward ${snapshot.transition.reward}. Old Q ${snapshot.transition.oldQ.toFixed(2)}. New Q ${snapshot.transition.newQ.toFixed(2)}.` : ''} ${snapshot.completed} episodes complete. Recent average reward ${snapshot.history.length ? (snapshot.history.reduce((sum, item) => sum + item.reward, 0) / snapshot.history.length).toFixed(1) : 'not available'}.` : 'The Q-learning simulator is loading.';
  const speak = () => { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); if (!speechOn) { const utterance = new SpeechSynthesisUtterance(narrative); utterance.onend = () => setSpeechOn(false); window.speechSynthesis.speak(utterance); setSpeechOn(true); } else setSpeechOn(false); };
  const importReports = async (files: FileList | null) => {
    if (!files) return;
    const accepted: typeof educatorReports = [];
    for (const file of Array.from(files).slice(0, 30)) {
      try {
        const report = JSON.parse(await file.text()) as { name?: string; concepts?: LearningStore['concepts']; labs?: LearningStore['labs'] };
        if (report.concepts && report.labs && typeof report.concepts === 'object' && typeof report.labs === 'object') accepted.push({ name: report.name || file.name, concepts: report.concepts, labs: report.labs });
      } catch { /* Ignore unrelated or damaged files. */ }
    }
    setEducatorReports((old) => [...old, ...accepted].slice(-100));
    setMessage(`${accepted.length} learner report${accepted.length === 1 ? '' : 's'} imported.`);
  };

  return <section className="ai-learn" aria-label={`${lab.title} learning companion`}>
    <header className="ai-learn-head"><span className="ai-learn-badge"><BookOpenCheck aria-hidden="true" /></span><div><h2>Learning Companion</h2><p>{content.goal}</p></div><span className="ai-learn-status">{labComplete(record, slug) ? 'Completed' : `${record.actions} lab actions · ${record.correct} correct`}</span><button type="button" className="ai-learn-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="ai-learn-body">{open ? 'Collapse' : 'Open'} <ChevronDown aria-hidden="true" /></button></header>
    {assigned && assigned.slug === slug && <p className="ai-learn-assignment"><strong>Assignment:</strong> {assigned.title} · Target: {assigned.target}{assigned.due && ` · Due ${assigned.due}`}</p>}
    {open && <div id="ai-learn-body" className="ai-learn-body"><div className="ai-learn-tabs" role="tablist" aria-label="Learning companion sections">{([['learn','Learn'],['guide','Guide'],['practice','Practice'],['explore','Explore'],['notebook','Notebook'],['progress','Progress'],['educator','Educator']] as const).map(([key,label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
      {tab === 'learn' && <div className="ai-learn-layout ai-theory-layout"><section className="ai-learn-card wide ai-theory-intro"><span className="ai-theory-eyebrow">The idea, in plain words</span><h3>About {lab.title}</h3><p>{theory.idea}</p></section><section className="ai-learn-card"><h3>How it works</h3><ol className="ai-theory-steps">{theory.how.map((step) => <li key={step}>{step}</li>)}</ol></section><section className="ai-learn-card"><h3>The key rule</h3><p className="ai-theory-rule">{theory.rule}</p><p className="ai-learn-small">Use this rule while stepping through the simulator below.</p></section><section className="ai-learn-card"><h3>Worked example</h3><p>{theory.example}</p></section><section className="ai-learn-card"><h3>Try it in the lab</h3><p>{theory.observe}</p><button type="button" onClick={() => document.querySelector('.ai-virtual-lab-frame')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Go to simulator</button></section><section className="ai-learn-card wide ai-theory-caution"><h3>Keep in mind</h3><p>{theory.caution}</p></section></div>}
      {tab === 'explore' && q && <div className="ai-learn-editbar" role="group" aria-label="Gridworld editing tool"><span>Grid tool:</span>{(['wall', 'penalty', 'goal', 'erase'] as const).map((mode) => <button type="button" key={mode} aria-pressed={editMode === mode} onClick={() => setEditMode(mode)}>{mode}</button>)}</div>}
      {tab === 'guide' && <div className="ai-learn-layout"><section className="ai-learn-card"><h3>Learning goal</h3><p>{content.goal}</p><p className="ai-learn-small"><strong>Complete this lab:</strong> {q ? 'calculate one Q update and pass the concept check' : 'try two lab actions and pass the concept check'}.</p><div className="ai-learn-concepts">{content.concepts.map((concept) => <span key={concept}>{concept} · {masteryLabel(store, concept)}</span>)}</div></section><section className="ai-learn-card"><h3>Before and after this lab</h3><strong>Prerequisites</strong><div className="ai-learn-links">{content.prerequisites.length ? content.prerequisites.map((id) => <Link key={id} to={aiVirtualLabRoute(id)}>{aiVirtualLabs.find((item) => item.slug === id)?.title}</Link>) : <span>Start here</span>}</div><strong>Related concepts</strong><div className="ai-learn-links">{content.related.map((id) => <Link key={id} to={aiVirtualLabRoute(id)}>{aiVirtualLabs.find((item) => item.slug === id)?.title}</Link>)}</div></section>{q && <><section className="ai-learn-card"><h3>Three-minute first run</h3><p>Follow the existing simulator. The companion watches, but does not change its engine.</p><button type="button" onClick={() => setMissionStart(Date.now())}><Play aria-hidden="true" /> {missionStart ? 'Restart mission' : 'Start mission'}</button>{missionStart > 0 && <ol className="ai-learn-steps"><li className={timeline.some((entry) => entry.action != null) ? 'done' : ''}>Choose an action with Step.</li><li className={timeline.some((entry) => Boolean(entry.transition)) ? 'done' : ''}>Observe the transition and reward.</li><li className={record.calculations ? 'done' : ''}>Calculate the new Q value in Practice.</li><li className={timeline.some((entry) => entry.completed > 0) ? 'done' : ''}>Finish an episode and inspect the greedy policy.</li></ol>}</section><section className="ai-learn-card"><h3>Worked example → independent practice</h3><p>For old Q = 0, reward = −1, α = 0.5, γ = 0.9, and max next Q = 2:</p>{showWorked ? <p className="ai-learn-equation">Target = −1 + 0.9 × 2 = 0.8<br />New Q = 0 + 0.5 × (0.8 − 0) = <strong>0.4</strong></p> : <p className="ai-learn-small">Try the live update independently in Practice. Reveal the worked steps if needed.</p>}<button type="button" onClick={() => setShowWorked(!showWorked)}>{showWorked ? 'Hide worked steps' : 'Reveal worked steps'}</button></section></>}</div>}
      {tab === 'practice' && <div className="ai-learn-layout">{q && <><section className="ai-learn-card"><h3>Predict before Step</h3><p>Choose the action you expect from the current state, then use this button to press the lab’s existing Step control.</p><div className="ai-learn-choice">{actions.map((action, index) => <label key={action}><input type="radio" name="prediction" checked={prediction === index} onChange={() => setPrediction(index)} />{action}</label>)}</div><button type="button" onClick={predictAndStep}>Check with Step</button>{predictionFeedback && <p role="status" className="ai-learn-feedback">{predictionFeedback}</p>}</section><section className="ai-learn-card"><h3>Calculate the TD update</h3>{snapshot?.transition ? <><p>Old Q {snapshot.transition.oldQ.toFixed(3)} · Reward {snapshot.transition.reward.toFixed(2)} · Max next Q {snapshot.transition.nextQ.toFixed(3)} · α {baseConfig.alpha} · γ {baseConfig.gamma}</p><label className="ai-learn-field">Your new Q value<input type="number" inputMode="decimal" step="0.001" value={calculation} onChange={(event) => setCalculation(event.target.value)} /></label><button type="button" onClick={checkCalculation}>Check calculation</button>{calculationFeedback && <p role="status" className="ai-learn-feedback">{calculationFeedback}</p>}</> : <p>Press Step in the simulator until you observe a state transition.</p>}</section></>}
        <section className="ai-learn-card"><h3>Concept check</h3><p>{content.check.prompt}</p><div className="ai-learn-choice vertical">{content.check.options.map((option, index) => <label key={option}><input type="radio" name={`check-${slug}`} checked={selectedAnswer === index} onChange={() => setSelectedAnswer(index)} />{option}</label>)}</div><button type="button" disabled={selectedAnswer < 0} onClick={assess}>Check answer</button>{answerFeedback && <p role="status" className="ai-learn-feedback">{answerFeedback}</p>}</section><section className="ai-learn-card"><h3>Spaced review</h3><p>{record.attempts ? `Next review: ${asDate(record.dueAt)}. ${record.dueAt <= today ? 'Ready now.' : 'Return later for another recall check.'}` : 'Answer the concept check to start your review schedule.'}</p><p className="ai-learn-small">Recall checks return after 1, 3, 7, and 14 days as your correct answers accumulate.</p></section>
        {q && <section className="ai-learn-card wide"><h3>Transition replay</h3><p>Read-only history. Replaying here leaves the live simulation untouched.</p><div className="ai-learn-toolbar"><button type="button" disabled={!timeline.length} onClick={() => { setPlaying(false); setReplayIndex(Math.max(0, (replayIndex < 0 ? timeline.length - 1 : replayIndex) - 1)); }}>← Previous</button><button type="button" disabled={!timeline.length} onClick={() => { setReplayIndex(replayIndex < 0 ? 0 : replayIndex); setPlaying(!playing); }}>{playing ? 'Pause replay' : 'Play slowly'}</button><button type="button" disabled={!timeline.length} onClick={() => { setPlaying(false); setReplayIndex(Math.min(timeline.length - 1, (replayIndex < 0 ? timeline.length - 1 : replayIndex) + 1)); }}>Next →</button><button type="button" onClick={() => { setPlaying(false); setReplayIndex(-1); }}><RotateCcw aria-hidden="true" /> Live</button></div><p className="ai-learn-timeline" aria-live="polite">{currentEvent ? `Episode ${currentEvent.episode}, step ${currentEvent.steps}, ${currentEvent.phase}: ${currentEvent.event}` : 'No transition yet.'}</p>{currentEvent?.transition && <p>State {currentEvent.transition.state} → {currentEvent.transition.next} · Action {actions[currentEvent.transition.action]} · Reward {currentEvent.transition.reward} · Q {currentEvent.transition.oldQ.toFixed(2)} → {currentEvent.transition.newQ.toFixed(2)}</p>}</section>}
      </div>}
      {tab === 'explore' && <div className="ai-learn-layout">{q ? <><section className="ai-learn-card"><h3>Counterfactual comparison</h3><p>Two fresh runs use the same grid and seed. Only one parameter changes.</p><label className="ai-learn-field">Change parameter<select value={parameter} onChange={(event) => { const key = event.target.value as typeof parameter; setParameter(key); setVariant(key === 'gamma' ? .5 : .05); }}>{(Object.keys(fieldNames) as (keyof typeof fieldNames)[]).map((key) => <option key={key} value={key}>{fieldNames[key]}</option>)}</select></label><label className="ai-learn-field">Variant {fieldNames[parameter]}: {variant.toFixed(2)}<input type="range" min="0" max="1" step="0.01" value={variant} onChange={(event) => setVariant(Number(event.target.value))} /></label><label className="ai-learn-field">Random seed<input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 2026)} /></label><button type="button" onClick={compare}>Compare 50 episodes</button></section><section className="ai-learn-card"><h3>Safe-route challenge</h3><p>Can this configuration learn a goal-reaching greedy route that avoids penalty cells within 50 episodes?</p><button type="button" onClick={runChallenge}>Assess challenge</button>{challenge && <><p className="ai-learn-feedback">{challenge.routeGoal && challenge.route.every((cell) => !challenge.environment.penalties.includes(cell)) ? 'Challenge passed: goal reached without penalty cells.' : `Not yet: ${resultReason(challenge)}`}</p><button type="button" onClick={() => saveRun(challenge)}>Save challenge run</button></>}</section><section className="ai-learn-card"><h3>Q-learning vs SARSA</h3><p>Run both on the same risky grid and seed to compare an off-policy max target with the actual next-action target.</p><button type="button" onClick={compareSarsa}>Compare algorithms</button></section><section className="ai-learn-card"><h3>Why did the policy fail?</h3><p>{snapshot ? snapshot.routeGoal ? 'The current greedy policy reaches the goal. Inspect whether it crosses penalty cells and whether more training improves reward.' : snapshot.routeReason === 'cycle' ? 'The policy repeats a state. Low exploration, sparse rewards, or too few episodes can leave Q values tied or incomplete.' : `Current route: ${snapshot.routeReason || 'still learning'}. More exploration or a different reward signal may change it.` : 'Run the lab to inspect a learned policy.'}</p></section>
        {comparison && <section className="ai-learn-card wide"><h3>Side-by-side result</h3><div className="ai-learn-compare"><div><strong>{comparison.baseline.algorithm === 'sarsa' ? 'SARSA' : 'Baseline Q-learning'}</strong><span>Goal: {comparison.baseline.routeGoal ? 'yes' : 'no'}</span><span>Success rate: {Math.round(comparison.baseline.successRate * 100)}%</span><span>Recent average reward: {averageLast(comparison.baseline.history).toFixed(1)}</span><RunGrid run={comparison.baseline} /></div><div><strong>{comparison.variant.algorithm === 'sarsa' ? 'SARSA' : `Variant ${fieldNames[parameter]}`}</strong><span>Goal: {comparison.variant.routeGoal ? 'yes' : 'no'}</span><span>Success rate: {Math.round(comparison.variant.successRate * 100)}%</span><span>Recent average reward: {averageLast(comparison.variant.history).toFixed(1)}</span><RunGrid run={comparison.variant} /></div></div><p>{resultReason(comparison.baseline)} {resultReason(comparison.variant)}</p><div className="ai-learn-toolbar"><button type="button" onClick={() => saveRun(comparison.baseline, comparison.variant)}><Save aria-hidden="true" /> Save comparison</button><button type="button" onClick={() => shareRun(comparison.variant)}><Share2 aria-hidden="true" /> Share variant</button></div></section>}
        <section className="ai-learn-card wide"><h3>Design a gridworld</h3><p>Start is fixed at the top left. Choose a grid tool above, then click cells to place walls, penalties, or a goal. Runs here use a separate engine.</p><div className="ai-learn-grid" role="group" aria-label="Editable five by five gridworld">{Array.from({ length: 25 }, (_, cell) => <button key={cell} type="button" disabled={cell === grid.start} className={cell === grid.start ? 'start' : cell === grid.goal ? 'goal' : grid.walls.includes(cell) ? 'wall' : grid.penalties.includes(cell) ? 'penalty' : ''} aria-label={`Row ${Math.floor(cell / 5) + 1}, column ${cell % 5 + 1}: ${cell === grid.start ? 'start' : cell === grid.goal ? 'goal' : grid.walls.includes(cell) ? 'wall' : grid.penalties.includes(cell) ? 'penalty' : 'empty'}`} onClick={() => cycleCell(cell)}>{cell === grid.start ? 'S' : cell === grid.goal ? '★' : grid.walls.includes(cell) ? '■' : grid.penalties.includes(cell) ? '−' : '·'}</button>)}</div><div className="ai-learn-toolbar"><button type="button" onClick={() => runCustom(grid, 'custom')}>Train on my grid</button><button type="button" onClick={() => setGrid({ size: 5, start: 0, goal: 24, walls: [6, 17], penalties: [8, 21] })}>Reset grid</button></div>{custom && <p role="status">{resultReason(custom)} Success in {Math.round(custom.successRate * 100)}% of episodes. <button type="button" onClick={() => saveRun(custom)}>Save run</button></p>}</section>
        <section className="ai-learn-card"><h3>Transfer challenge</h3><p>Apply your parameter choices to a new, unseen map with a different obstacle and penalty layout.</p><button type="button" onClick={() => runCustom({ size: 5, start: 0, goal: 24, walls: [5, 6, 12, 17], penalties: [8, 16] }, 'transfer')}>Try unseen grid</button>{transfer && <p role="status">{resultReason(transfer)} Recent average reward {averageLast(transfer.history).toFixed(1)}.</p>}</section><section className="ai-learn-card"><h3>Accessible run summary</h3><p className="ai-learn-small" >{narrative}</p><button type="button" onClick={speak}><Volume2 aria-hidden="true" /> {speechOn ? 'Stop narration' : 'Read summary aloud'}</button></section>
        <section className="ai-learn-card wide"><h3>Reward chart data</h3><p className="ai-learn-small">Recent episode rewards in a table for keyboard and screen reader access.</p>{snapshot?.history.length ? <div className="ai-learn-table-wrap"><table><caption>Last {Math.min(snapshot.history.length, 10)} training episodes</caption><thead><tr><th scope="col">Episode</th><th scope="col">Reward</th><th scope="col">Steps</th><th scope="col">Goal reached</th></tr></thead><tbody>{snapshot.history.slice(-10).map((item, index) => <tr key={`${item.episode}-${index}`}><th scope="row">{item.episode}</th><td>{item.reward}</td><td>{item.steps}</td><td>{item.success ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div> : <p>Train an episode to see reward data.</p>}</section>
        {shared?.kind === 'experiment' && shared.slug === slug && <section className="ai-learn-card"><h3>Shared experiment</h3><p>Run the shared seed and settings in the independent sandbox.</p><button type="button" onClick={() => { const result = runSandbox({ seed: shared.seed, config: shared.config, environment: shared.environment, episodes: shared.config.episodes, maxSteps: shared.config.maxSteps }); if (result) setCustom(result); }}>Run shared experiment</button></section>}
      </> : <section className="ai-learn-card"><h3>Experiment prompt</h3><p>Change one lab setting, predict what will happen, then compare the observed state. Save your reasoning in the Notebook tab.</p><p className="ai-learn-small">The simulator’s own controls and results remain available below this companion.</p></section>}</div>}
      {tab === 'notebook' && <div className="ai-learn-layout"><section className="ai-learn-card"><h3>Lab notebook</h3>{(['prediction','observation','conclusion'] as const).map((field) => <label className="ai-learn-field" key={field}>{field[0].toUpperCase() + field.slice(1)}<textarea rows={3} value={record.notebook[field]} onChange={(event) => setStore((old) => updateLabRecord(old, slug, { notebook: { ...labRecord(old, slug).notebook, [field]: event.target.value } }))} /></label>)}<p className="ai-learn-small">Saved automatically in this browser.</p></section><section className="ai-learn-card"><h3>Saved experiments</h3>{store.experiments.filter((item) => item.slug === slug).length ? store.experiments.filter((item) => item.slug === slug).map((item) => <div className="ai-learn-saved" key={item.id}><strong>{item.title}</strong><span>{asDate(item.savedAt)} · Seed {item.seed} · {Math.round(item.baseline.successRate * 100)}% success</span><div className="ai-learn-toolbar"><button type="button" onClick={() => shareRun(item.baseline)}>Share</button><button type="button" onClick={() => download(`${slug}-${item.id}.json`, JSON.stringify(item, null, 2), 'application/json')}>Export JSON</button></div></div>) : <p>No saved experiments yet. Q-learning comparisons and challenges can be saved from Explore.</p>}</section></div>}
      {tab === 'progress' && <div className="ai-learn-layout"><section className="ai-learn-card"><h3>Concept mastery</h3>{Object.entries(store.concepts).length ? <ul className="ai-learn-list">{Object.entries(store.concepts).map(([concept, progress]) => <li key={concept}><strong>{concept}</strong><span>{masteryLabel(store, concept)} · {strength(progress)} · review {asDate(progress.dueAt)}</span></li>)}</ul> : <p>Complete a concept check to start tracking mastery.</p>}</section><section className="ai-learn-card"><h3>Due for review</h3>{reviewed.length ? <div className="ai-learn-links">{reviewed.map((id) => <Link key={id} to={aiVirtualLabRoute(id)}>{aiVirtualLabs.find((item) => item.slug === id)?.title}</Link>)}</div> : <p>No concepts are due today.</p>}<p className="ai-learn-small">Review dates are based on your answers and stay on this device.</p></section><section className="ai-learn-card wide"><h3>Diagnostic quiz</h3><p>Answer three quick questions to choose your next lab.</p>{diagnosticQuestions.map((question, index) => <label className="ai-learn-field" key={question.prompt}>{question.prompt}<select value={diagnostic[index]} onChange={(event) => setDiagnostic((old) => old.map((value, i) => i === index ? Number(event.target.value) : value))}><option value="-1">Choose an answer</option>{question.options.map((option, choice) => <option value={choice} key={option}>{option}</option>)}</select></label>)}<button type="button" disabled={diagnostic.some((answer) => answer < 0)} onClick={() => setRecommendation(diagnostic.filter((answer, index) => answer === diagnosticQuestions[index].answer).length <= 1 ? 'markov-decision-process-explorer' : diagnostic[2] !== diagnosticQuestions[2].answer ? 'q-learning' : 'sarsa-learning')}>Find my next lab</button>{recommendation && <p role="status">Recommended: <Link to={aiVirtualLabRoute(recommendation)}>{aiVirtualLabs.find((item) => item.slug === recommendation)?.title}</Link></p>}</section></div>}
      {tab === 'educator' && <div className="ai-learn-layout"><section className="ai-learn-card"><h3>Create an assignment</h3><label className="ai-learn-field">Title<input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} /></label><label className="ai-learn-field">Due date<input type="date" value={assignmentDue} onChange={(event) => setAssignmentDue(event.target.value)} /></label><label className="ai-learn-field">Completion target<select value={assignmentTarget} onChange={(event) => setAssignmentTarget(event.target.value as 'completion' | 'challenge')}><option value="completion">{q ? 'TD calculation + concept check' : 'Two lab actions + concept check'}</option>{q && <option value="challenge">Safe-route challenge</option>}</select></label><button type="button" onClick={async () => { const payload: Assignment = { slug, title: assignmentTitle, due: assignmentDue, target: assignmentTarget === 'challenge' && q ? 'Safe-route challenge' : q ? 'TD calculation + concept check' : 'Two lab actions + concept check' }; const url = `${location.origin}${aiVirtualLabRoute(slug)}?assignment=${encodeShare(payload)}`; setAssignmentLink(url); try { await navigator.clipboard.writeText(url); } catch { /* The visible link remains available. */ } }}><Share2 aria-hidden="true" /> Create assignment link</button>{assignmentLink && <p className="ai-learn-wrap" role="status">{assignmentLink}</p>}</section><section className="ai-learn-card"><h3>Progress on this device</h3><p>Assignments can be shared by link. This report summarizes learning records saved in the current browser.</p><ul className="ai-learn-list">{aiVirtualLabs.filter((item) => store.labs[item.slug]).map((item) => { const progress = labRecord(store, item.slug); return <li key={item.slug}><strong>{item.title}</strong><span>{labComplete(progress, item.slug) ? 'Complete' : 'In progress'} · {progress.correct}/{progress.attempts} checks · {progress.actions} actions</span></li>; })}</ul><button type="button" onClick={() => { const rows = [['Lab','Complete','Actions','Correct checks','Attempts'],...aiVirtualLabs.map((item) => { const progress = labRecord(store, item.slug); return [item.title, String(labComplete(progress, item.slug)), String(progress.actions), String(progress.correct), String(progress.attempts)]; })]; download('ai-lab-learning-report.csv', rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n'), 'text/csv'); }}><ClipboardList aria-hidden="true" /> Export progress CSV</button></section></div>}
      {tab === 'educator' && <div className="ai-learn-layout"><section className="ai-learn-card"><h3>Learner reports</h3><p>Ask learners to export a report and import the JSON files here. Reports stay in this browser.</p><button type="button" onClick={() => download('ai-lab-learner-report.json', JSON.stringify({ name: 'Learner', exportedAt: Date.now(), concepts: store.concepts, labs: store.labs }, null, 2), 'application/json')}>Export learner report JSON</button><label className="ai-learn-field">Import learner reports<input type="file" accept=".json,application/json" multiple onChange={(event) => importReports(event.target.files)} /></label><p>{educatorReports.length} learner reports imported.</p></section><section className="ai-learn-card"><h3>Concepts needing support</h3>{missedConcepts.length ? <ul className="ai-learn-list">{missedConcepts.map(([concept, totals]) => <li key={concept}><strong>{concept}</strong><span>{totals.missed} missed of {totals.attempts} attempts</span></li>)}</ul> : <p>Import learner reports to see which concepts are missed most often.</p>}</section></div>}
      {message && <p className="ai-learn-message" role="status"><Lightbulb aria-hidden="true" /> {message}</p>}
    </div>}
    <span className="ai-learn-sr"><GraduationCap /> Learning support uses the current lab and saves progress locally.</span>
  </section>;
}
