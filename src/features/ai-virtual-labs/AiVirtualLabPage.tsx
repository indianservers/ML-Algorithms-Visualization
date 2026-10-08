import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BrainCircuit, Clock3, Compass, Lightbulb } from 'lucide-react';
import { VisualizationSkeleton } from '../../components/common/EmptyState';
import { aiVirtualLabRoute, getAiVirtualLab } from './catalog';
import { AiAlgorithmIllustration } from './AiAlgorithmIllustration';
import { LearningCompanion } from './LearningCompanion';
import { readLearningStore, recordAction, writeLearningStore, type QSnapshot } from './learningModel';
import './AiVirtualLabPage.css';

export default function AiVirtualLabPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [readyUrl, setReadyUrl] = useState('');
  const [frameSize, setFrameSize] = useState({ url: '', height: 900 });
  const [snapshot, setSnapshot] = useState<QSnapshot | null>(null);
  const [timeline, setTimeline] = useState<QSnapshot[]>([]);
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

  return (
    <main className="ai-virtual-lab-page">
      <div className="ai-virtual-lab-heading">
        <Link to="/" className="ai-virtual-lab-back"><ArrowLeft size={17} /> Home</Link>
        <div className="ai-virtual-lab-title">
          <span className="ai-virtual-lab-mark"><BrainCircuit size={22} /></span>
          <div><p>AI Algorithms Virtual Labs</p><h1>{lab.title}</h1><span>{lab.summary}</span></div>
        </div>
      </div>
      {!ready && <div className="ai-virtual-lab-loading" aria-label="Loading virtual lab"><VisualizationSkeleton /></div>}
      <iframe
        key={frameUrl}
        ref={frameRef}
        src={frameUrl}
        title={`${lab.title} interactive virtual lab`}
        className={`ai-virtual-lab-frame${ready ? ' is-ready' : ''}`}
        style={{ height }}
      />
      <LearningCompanion key={lab.slug} lab={lab} snapshot={snapshot} timeline={timeline} frameRef={frameRef} store={learningStore} setStore={setLearningStore} />
    </main>
  );
}
