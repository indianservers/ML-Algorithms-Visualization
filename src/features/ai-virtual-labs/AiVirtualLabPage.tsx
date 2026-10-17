import { lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BrainCircuit, Clock3, Compass, FlaskConical, Lightbulb, Network } from 'lucide-react';
import { VisualizationSkeleton } from '../../components/common/EmptyState';
import { aiVirtualLabRoute, getAiVirtualLab } from './catalog';
import { AiAlgorithmIllustration } from './AiAlgorithmIllustration';
import { LearningCompanion } from './LearningCompanion';
import { GraphLearningStudio, isGraphLearningLab } from './GraphLearningStudio';
import { readLearningStore, recordAction, writeLearningStore, type QSnapshot } from './learningModel';
import './AiVirtualLabPage.css';
import { isTargetedAILab } from './targeted/registry';
const TargetedAILab = lazy(() => import('./targeted/TargetedAILab').then(module => ({ default: module.TargetedAILab })));

export default function AiVirtualLabPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [readyUrl, setReadyUrl] = useState('');
  const [frameSize, setFrameSize] = useState({ url: '', height: 900 });
  const [snapshot, setSnapshot] = useState<QSnapshot | null>(null);
  const [timeline, setTimeline] = useState<QSnapshot[]>([]);
  const [workspace, setWorkspace] = useState<{ slug: string; tab: 'simulator' | 'graph' }>({ slug, tab: 'simulator' });
  const [learningStore, setLearningStore] = useState(readLearningStore);
  const timelineSlug = useRef('');
  const lab = getAiVirtualLab(slug);
  const saved = searchParams.get('saved') === '1';
  const frameUrl = useMemo(() => lab && 'bundle' in lab
    ? `/ai-algorithms/${lab.bundle}/index.html?lab=${encodeURIComponent(lab.sourceKey)}${saved ? '&saved=1' : ''}`
    : '', [lab, saved]);
  const ready = readyUrl === frameUrl;
  const height = frameSize.url === frameUrl ? frameSize.height : 900;

  useEffect(() => { writeLearningStore(learningStore); }, [learningStore]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; height?: number; slug?: string; saved?: boolean; snapshot?: QSnapshot };
      if (data.type === 'ai-lab-size' && Number.isFinite(data.height)) {
        setFrameSize({ url: frameUrl, height: Math.max(500, Math.min(30000, Math.ceil(data.height ?? 900) + 8)) });
      }
      if (data.type === 'ai-lab-ready') setReadyUrl(frameUrl);
      if (data.type === 'ai-learning-activity' && lab) setLearningStore((old) => recordAction(old, lab.slug));
      if (data.type === 'ai-learning-q-snapshot' && slug === 'q-learning' && data.snapshot) {
        const next = data.snapshot;
        setSnapshot(next);
        setTimeline((current) => {
          const key = (entry: QSnapshot) => `${entry.episode}:${entry.steps}:${entry.phase}:${entry.transition?.updated ?? ''}`;
          if (timelineSlug.current !== slug) { timelineSlug.current = slug; return [next]; }
          return current.length && key(current[current.length - 1]) === key(next) ? current : [...current, next].slice(-60);
        });
      }
      if (data.type === 'ai-lab-navigate' && data.slug && getAiVirtualLab(data.slug)) {
        navigate(`${aiVirtualLabRoute(data.slug)}${data.saved ? '?saved=1' : ''}`);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate, lab, slug, frameUrl]);

  if (!lab) {
    return <main className="ai-virtual-lab-page"><h1>Lab not found</h1><Link to="/">Return home</Link></main>;
  }

  if (isTargetedAILab(slug)) return <TargetedAILab key={slug} lab={lab} />;

  if ('family' in lab) {
    return <main className="ai-virtual-lab-page ai-upcoming-page">
      <div className="ai-virtual-lab-heading">
        <Link to="/" className="ai-virtual-lab-back"><ArrowLeft size={17} /> AI Virtual Labs</Link>
        <div className="ai-virtual-lab-title"><span className="ai-virtual-lab-mark"><BrainCircuit size={22} /></span><div><p>AI Algorithms Virtual Labs · {lab.family}</p><h1>{lab.title}</h1><span>{lab.summary}</span></div></div>
      </div>
      <div className="ai-upcoming-hero">
        <div><span className="ai-upcoming-badge"><Clock3 size={16}/> Upcoming Virtual Lab</span><h2>Explore {lab.title}</h2><p>{lab.summary} This route is reserved for a future interactive lab. The simulator and practice controls are still being developed.</p><Link to={aiVirtualLabRoute(lab.relatedSlug)} className="ai-upcoming-related"><Compass size={17}/> Explore a related live lab <ArrowRight size={16}/></Link></div>
        <div className="ai-upcoming-art"><AiAlgorithmIllustration slug={lab.slug} family={lab.family}/></div>
      </div>
      <div className="ai-upcoming-details"><section><h3><Lightbulb size={18}/> Concepts this lab will cover</h3><ul>{lab.concepts.map(concept => <li key={concept}>{concept}</li>)}</ul></section><section><h3><BrainCircuit size={18}/> Planned interaction</h3><p>{lab.plannedInteraction}</p><p className="ai-upcoming-note">Upcoming — this interaction is not available yet.</p></section></div>
    </main>;
  }

  const hasGraphExplorer = isGraphLearningLab(lab.slug);
  const workspaceTab = workspace.slug === slug ? workspace.tab : 'simulator';

  return (
    <main className="ai-virtual-lab-page">
      <div className="ai-virtual-lab-heading">
        <Link to="/" className="ai-virtual-lab-back"><ArrowLeft size={17} /> Home</Link>
        <div className="ai-virtual-lab-title">
          <span className="ai-virtual-lab-mark"><BrainCircuit size={22} /></span>
          <div><p>AI Algorithms Virtual Labs</p><h1>{lab.title}</h1><span>{lab.summary}</span></div>
        </div>
      </div>
      <LearningCompanion key={lab.slug} lab={lab} snapshot={snapshot} timeline={timeline} frameRef={frameRef} store={learningStore} setStore={setLearningStore} />
      <section className="ai-lab-workspace" aria-labelledby="ai-lab-workspace-title">
        <header className="ai-lab-workspace-head">
          <div><span>Apply what you learned</span><h2 id="ai-lab-workspace-title">{lab.title} workspace</h2><p>Only tools that directly demonstrate this algorithm are shown here.</p></div>
          {hasGraphExplorer ? <div className="ai-lab-workspace-tabs" role="tablist" aria-label={`${lab.title} visual workspaces`}>
            <button type="button" role="tab" aria-selected={workspaceTab === 'simulator'} aria-controls="ai-lab-simulator-panel" onClick={() => setWorkspace({ slug, tab: 'simulator' })}><FlaskConical aria-hidden="true" /> Interactive Lab</button>
            <button type="button" role="tab" aria-selected={workspaceTab === 'graph'} aria-controls="ai-lab-graph-panel" onClick={() => setWorkspace({ slug, tab: 'graph' })}><Network aria-hidden="true" /> Graph Explorer</button>
          </div> : <span className="ai-lab-workspace-specific"><FlaskConical aria-hidden="true" /> Page-specific simulator</span>}
        </header>
        <div id="ai-lab-simulator-panel" role="tabpanel" aria-label={`${lab.title} interactive lab`} hidden={workspaceTab !== 'simulator'}>
          {!ready && <div className="ai-virtual-lab-loading" aria-label="Loading virtual lab"><VisualizationSkeleton /></div>}
          <iframe
            key={frameUrl}
            ref={frameRef}
            src={frameUrl}
            title={`${lab.title} interactive virtual lab`}
            className={`ai-virtual-lab-frame${ready ? ' is-ready' : ''}`}
            style={{ height }}
          />
        </div>
        {hasGraphExplorer && workspaceTab === 'graph' && <div id="ai-lab-graph-panel" role="tabpanel" aria-label={`${lab.title} graph explorer`}><GraphLearningStudio key={lab.slug} slug={lab.slug} /></div>}
      </section>
    </main>
  );
}
