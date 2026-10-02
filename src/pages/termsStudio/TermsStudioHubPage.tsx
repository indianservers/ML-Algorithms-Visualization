import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Atom, BookOpen, Box, BrainCircuit, ChartNoAxesColumn,
  Check, ChevronRight, Database, Eye, Flag, GraduationCap, Grid2X2,
  Image, Layers3, Leaf, Lightbulb, List, MessageCircle, Network, Pi, Clock3, Gamepad2, Bot, Puzzle,
  Scale, Search, SlidersHorizontal, Sparkles, Target, TreePine, X, type LucideIcon,
} from 'lucide-react';
import { termRoute, termsStudioLessons, type TermLesson } from '../../data/termsStudio';
import {
  GLOSSARY_PILLS, getGlossaryLabel, getGlossaryLane, getGlossaryLine,
  type GlossaryPill, type GlossarySort,
} from '../../data/termsStudioGlossary';
import { filterTermsCatalog, TERMS_PAGE_SIZE } from './termsStudioCatalog';
import './TermsStudio.css';
import './TermsStudioHub.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
type ViewMode = 'grid' | 'list';
const pillIcons: Record<GlossaryPill, LucideIcon> = {
  All: Grid2X2, Beginner: Leaf, Core: Layers3, Evaluation: ChartNoAxesColumn,
  Optimization: SlidersHorizontal, Training: GraduationCap, Data: Database,
  Models: Box, Trees: TreePine, CNN: Network, Sequence: Activity,
  Attention: Eye, Math: Pi, NLP: MessageCircle, Vision: Image,
  AI: BrainCircuit, Reinforcement: Gamepad2, 'Time Series': Clock3,
  Tasks: Puzzle, 'Hugging Face': Bot,
};
const termIcons: Record<string, LucideIcon> = {
  accuracy: Target, adam: Atom, attention: Eye, 'data-augmentation': Image,
  backpropagation: Network, bagging: Database, baseline: Flag, batch: Grid2X2,
  'batch-layer-norm': ChartNoAxesColumn, 'batch-size': Box,
  'binary-cross-entropy': Pi, 'bias-variance': Scale,
};

function TermsHero({ count }: { count: number }) {
  return <header className="tsh-hero">
    <div className="tsh-hero-copy">
      <p className="tsh-eyebrow">AI DICTIONARY</p>
      <h1>Terms <span>Studio</span></h1>
      <p className="tsh-hero-description">Fast, simple definitions. Search A–Z, then open one visual — the catalog does not load simulators.</p>
      <div className="tsh-benefits" aria-label="What Terms Studio offers">
        <div><span className="tsh-benefit-icon violet"><BookOpen aria-hidden="true" /></span><span><strong>Learn Faster</strong><small>Clear, concise definitions</small></span></div>
        <div><span className="tsh-benefit-icon green"><Lightbulb aria-hidden="true" /></span><span><strong>Visual Concepts</strong><small>See ideas come to life</small></span></div>
        <div><span className="tsh-benefit-icon orange"><Layers3 aria-hidden="true" /></span><span><strong>Explore by Category</strong><small>Find terms quickly</small></span></div>
      </div>
    </div>
    <div className="tsh-hero-art" role="img" aria-label="Neural network forming a human profile" />
    <div className="tsh-hero-aside">
      <div className="tsh-stat"><strong>{count}</strong><span>terms</span></div>
      <ul>
        <li><BrainCircuit aria-hidden="true" /> AI · ML · DL</li>
        <li><BookOpen aria-hidden="true" /> Clear Definitions</li>
        <li><Eye aria-hidden="true" /> Visual Learning</li>
        <li><Grid2X2 aria-hidden="true" /> Explore A–Z</li>
      </ul>
    </div>
  </header>;
}

function TermCard({ term }: { term: TermLesson }) {
  const lane = getGlossaryLane(term);
  const Icon = termIcons[term.slug] ?? pillIcons[lane];
  return <Link to={termRoute(term.slug)} className="tsh-term" data-lane={lane} aria-label={`Open ${getGlossaryLabel(term)}`}>
    <span className="tsh-term-icon"><Icon aria-hidden="true" /></span>
    <span className="tsh-term-main">
      <span className="tsh-term-heading"><strong>{getGlossaryLabel(term)}</strong><small>{term.badge} · {lane}</small></span>
      <span className="tsh-term-definition">{getGlossaryLine(term)}</span>
    </span>
    <span className="tsh-term-arrow"><ChevronRight aria-hidden="true" /></span>
  </Link>;
}

export default function TermsStudioHubPage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState<GlossaryPill>('All');
  const [letter, setLetter] = useState('All');
  const [sort, setSort] = useState<GlossarySort>('az');
  const [visibleCount, setVisibleCount] = useState(TERMS_PAGE_SIZE);
  const [view, setView] = useState<ViewMode>(() => {
    try { return window.localStorage.getItem('terms-studio-view') === 'list' ? 'list' : 'grid'; }
    catch { return 'grid'; }
  });

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) searchRef.current?.blur();
    };
    window.addEventListener('ml:terms-search', focusSearch);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('ml:terms-search', focusSearch);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const availableLetters = useMemo(() => new Set(termsStudioLessons.map((term) => getGlossaryLabel(term).charAt(0).toUpperCase())), []);
  const availablePills = useMemo(() => GLOSSARY_PILLS.filter((item) => item === 'All' || item === 'Beginner' || termsStudioLessons.some((term) => getGlossaryLane(term) === item)), []);
  const filtered = useMemo(() => filterTermsCatalog(termsStudioLessons, query, pill, letter, sort), [query, pill, letter, sort]);
  const shown = filtered.slice(0, visibleCount);

  const resetFilters = () => { setQuery(''); setPill('All'); setLetter('All'); setSort('az'); setVisibleCount(TERMS_PAGE_SIZE); };
  const changeView = (next: ViewMode) => {
    setView(next);
    try { window.localStorage.setItem('terms-studio-view', next); } catch { /* storage may be unavailable */ }
  };

  return <div className="terms-studio ts-dict tsh-catalog">
    <TermsHero count={termsStudioLessons.length} />
    <div className="tsh-content">
      <div className="tsh-tools">
        <div className="tsh-search-wrap">
          <div className="tsh-search">
            <Search aria-hidden="true" />
            <input id="terms-search" ref={searchRef} type="search" value={query}
              aria-label="Search terms"
              onChange={(event) => { setQuery(event.target.value); setVisibleCount(TERMS_PAGE_SIZE); }}
              placeholder="Search terms, e.g. learning rate, lr, gini, ROC, regularisation..." />
            {query
              ? <button type="button" className="tsh-clear" aria-label="Clear search" onClick={() => { setQuery(''); setVisibleCount(TERMS_PAGE_SIZE); searchRef.current?.focus(); }}><X aria-hidden="true" /></button>
              : <kbd>{/Mac/i.test(navigator.userAgent) ? '⌘' : 'Ctrl'} + K</kbd>}
          </div>
          <button className="tsh-search-button" type="button" onClick={() => { searchRef.current?.focus(); resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}><Search aria-hidden="true" /> Search</button>
        </div>
        <div className="tsh-tools-right">
          <label className="tsh-sort" htmlFor="terms-sort">Sort by <select id="terms-sort" value={sort} onChange={(event) => setSort(event.target.value as GlossarySort)}>
            <option value="az">A – Z</option><option value="za">Z – A</option><option value="beginner">Beginner first</option><option value="intermediate">Intermediate first</option>
          </select></label>
          <div className="tsh-view-switch" role="group" aria-label="View mode">
            <button type="button" className={view === 'grid' ? 'is-active' : ''} aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => changeView('grid')}><Grid2X2 aria-hidden="true" /></button>
            <button type="button" className={view === 'list' ? 'is-active' : ''} aria-label="List view" aria-pressed={view === 'list'} onClick={() => changeView('list')}><List aria-hidden="true" /></button>
          </div>
        </div>
      </div>

      <div className="tsh-pill-scroll"><div className="tsh-pills" role="group" aria-label="Filter by category or level">
        {availablePills.map((item) => {
          const Icon = pillIcons[item];
          return <button key={item} type="button" aria-pressed={pill === item} className={pill === item ? 'is-active' : ''}
            onClick={() => { setPill(item); setVisibleCount(TERMS_PAGE_SIZE); }}><Icon aria-hidden="true" />{item}</button>;
        })}
      </div></div>

      <div className="tsh-az-row">
        <div className="tsh-az-scroll"><nav className="tsh-az" aria-label="Filter by first letter">
          <button type="button" className={letter === 'All' ? 'is-active' : ''} aria-current={letter === 'All' ? 'true' : undefined} onClick={() => { setLetter('All'); setVisibleCount(TERMS_PAGE_SIZE); }}>All</button>
          {LETTERS.map((item) => <button key={item} type="button" disabled={!availableLetters.has(item)} aria-label={`Show terms starting with ${item}`}
            aria-current={letter === item ? 'true' : undefined} className={letter === item ? 'is-active' : ''} onClick={() => { setLetter(item); setVisibleCount(TERMS_PAGE_SIZE); }}>{item}</button>)}
        </nav></div>
        <span className="tsh-results-count" aria-live="polite">{filtered.length ? `Showing 1–${shown.length} of ${filtered.length} terms` : 'Showing 0 terms'}</span>
      </div>

      <div ref={resultsRef} className={`tsh-grid ${view === 'list' ? 'is-list' : ''}`}>
        {shown.map((term) => <TermCard key={term.slug} term={term} />)}
      </div>
      {filtered.length === 0 && <div className="tsh-no-results"><Sparkles aria-hidden="true" /><h2>No terms found</h2><p>Try a different keyword or remove a filter.</p><button type="button" onClick={resetFilters}>Clear filters <X aria-hidden="true" /></button></div>}
      {shown.length < filtered.length && <button type="button" className="tsh-load-more" onClick={() => setVisibleCount((current) => current + TERMS_PAGE_SIZE)}>Show more terms <ArrowRight aria-hidden="true" /></button>}
      {shown.length === filtered.length && filtered.length > TERMS_PAGE_SIZE && <p className="tsh-end"><Check aria-hidden="true" /> You’re viewing all {filtered.length} matching terms.</p>}
    </div>
  </div>;
}
