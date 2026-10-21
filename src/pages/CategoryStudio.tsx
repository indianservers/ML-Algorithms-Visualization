import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Menu, Search, X } from 'lucide-react';
import { studios, studioItems, studioUrl } from '../data/studios';
import { AlgorithmGlyph } from '../components/common/AlgorithmGlyph';
import { algorithmSearchMeta } from '../data/algorithmSearchMeta';
import { AlgorithmLabCard } from '../features/ai-virtual-labs/AlgorithmLabCard';
import { getAiVirtualLab } from '../features/ai-virtual-labs/catalog';
import '../features/computer-vision/ComputerVision.css';
import './CategoryStudio.css';
import { TimeSeriesStudio } from './TimeSeriesStudio';

export default function CategoryStudio() {
  const { category } = useParams();
  const studio = studios.find(s => s.id === category);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  if (!studio) return <section><h1>Studio not found</h1><Link to="/">Explore categories</Link></section>;
  const Icon = studio.icon;
  const items = studioItems(studio.id);
  const visible = items.filter(item => (filter === 'All' || item.badge === filter) && `${item.label} ${item.category} ${algorithmSearchMeta[item.route]?.description ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const filters = ['All', ...new Set(items.map(item => item.badge))];
  const isAiVirtualLabs = studio.id === 'ai-virtual-labs';
  return <div className={`cv-studio category-studio ${isAiVirtualLabs ? 'avl-studio' : ''} ${studio.id === 'time-series' ? 'ts-studio' : ''}`} key={studio.id}>
    <button className="cv-menu-toggle" onClick={() => setOpen(true)} aria-expanded={open}><Menu size={16}/> Studios</button>
    {open && <button className="cv-menu-backdrop" aria-label="Close studios menu" onClick={() => setOpen(false)}/>}
    <aside className={`cv-sidebar ${open ? 'is-open' : ''}`} aria-label="Category studios">
      <div className="cv-sidebar-brand"><span className="cv-sidebar-mark"><Icon size={18}/></span><span><strong>{studio.title}</strong><em>Studio</em></span><button className="cv-sidebar-close" onClick={() => setOpen(false)} aria-label="Close studios menu"><X size={16}/></button></div>
      <nav className="cv-sidebar-nav"><p>Studios</p>{studios.map(s => { const Glyph = s.icon; return <Link key={s.id} to={studioUrl(s.id)} className={s.id === studio.id ? 'is-active' : undefined} aria-current={s.id === studio.id ? 'page' : undefined} onClick={() => { setOpen(false); setQuery(''); setFilter('All'); }}><Glyph size={15}/><span>{s.title}</span></Link>; })}<p>{studio.title} labs</p>{items.map(item => <Link key={item.route} to={item.route}><AlgorithmGlyph route={item.route} label={item.label} size={18}/><span>{item.label}</span></Link>)}</nav>
      <Link to="/" className="cv-sidebar-back"><ArrowLeft size={15}/> All categories</Link>
    </aside>
    <div className="cv-studio-main"><section className="cv-page">{studio.id === 'time-series' ? <TimeSeriesStudio/> : <>
      <header className="cv-page-head"><div>{isAiVirtualLabs && <span className="avl-eyebrow">Interactive algorithm atlas</span>}<h1><Icon size={24}/> {studio.title} Studio</h1><p>{isAiVirtualLabs ? 'Watch each algorithm think, preview a real transition, then enter the full lab.' : 'Pick a lab. Learn the idea, explore its visualization, and experiment.'}</p></div></header>
      <div className="cv-home-stats">{isAiVirtualLabs ? <><article><b>{items.length}</b><span>Algorithm worlds</span></article><article><b>{items.filter(i => i.badge === 'Advanced').length}</b><span>Live labs</span></article><article><b>{items.filter(i => i.badge === 'Upcoming').length}</b><span>Upcoming labs</span></article><article><b>Preview</b><span>Run a concept on every card</span></article></> : <><article><b>{items.length}</b><span>Built-in labs</span></article><article><b>{items.filter(i => i.badge === 'Beginner').length}</b><span>Beginner labs</span></article><article><b>Visualize</b><span>Explore how algorithms work</span></article><article><b>Experiment</b><span>Open a lab to get started</span></article></>}</div>
      <label className="studio-search"><Search size={18}/><input aria-label="Search studio labs" placeholder="Search labs…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16}/></button>}</label>
      <div className="cv-filters" aria-label="Filter labs by level">{filters.map(f => <button key={f} className={filter === f ? 'is-on' : undefined} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <p className="studio-count" aria-live="polite">{visible.length} of {items.length} labs</p>
      {isAiVirtualLabs ? <div className="avl-card-grid">{visible.map(item => {
        const lab = getAiVirtualLab(item.route.split('/').filter(Boolean).at(-1) ?? '');
        return lab ? <AlgorithmLabCard key={item.route} lab={lab} description={algorithmSearchMeta[item.route]?.description ?? lab.summary} /> : null;
      })}</div> : <div className="cv-home-grid">{visible.map(item => <Link key={item.route} to={item.route} className="cv-home-card"><span className="cv-home-card-thumb studio-thumb"><AlgorithmGlyph route={item.route} label={item.label} size={76}/><i>{item.badge}</i></span><span className="cv-home-card-body"><strong>{item.label} <ArrowUpRight size={15}/></strong><em>{algorithmSearchMeta[item.route]?.description ?? `Explore ${item.label} with an interactive lab.`}</em><small>{item.category.replace('Supervised - ', '')}</small></span></Link>)}</div>}
      {visible.length === 0 && <p>No labs match. Try another search or choose All.</p>}
    </>}</section></div>
  </div>;
}
