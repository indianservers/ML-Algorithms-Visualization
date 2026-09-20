import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  termRoute,
  termsStudioLessons,
  type TermLesson,
} from '../../data/termsStudio';
import {
  GLOSSARY_PILLS,
  getGlossaryLabel,
  getGlossaryLane,
  getGlossaryLine,
  type GlossaryPill,
  type GlossarySort,
} from '../../data/termsStudioGlossary';
import { matchTermsStudioQuery } from '../../data/termsStudioEnhance';
import './TermsStudio.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function letterOf(term: TermLesson) {
  return getGlossaryLabel(term).charAt(0).toUpperCase();
}

export default function TermsStudioHubPage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState<GlossaryPill>('All');
  const [letter, setLetter] = useState('All');
  const [sort, setSort] = useState<GlossarySort>('az');

  useEffect(() => {
    const focusSearch = () => searchRef.current?.focus();
    window.addEventListener('ml:terms-search', focusSearch);
    return () => window.removeEventListener('ml:terms-search', focusSearch);
  }, []);

  const availableLetters = useMemo(() => {
    const set = new Set(termsStudioLessons.map(letterOf));
    return LETTERS.filter((item) => set.has(item));
  }, []);

  const filtered = useMemo(() => {
    const matched = matchTermsStudioQuery(query);
    const rows = matched.filter((term) => {
      if (pill === 'Beginner' && term.badge !== 'Beginner') return false;
      if (pill !== 'All' && pill !== 'Beginner' && getGlossaryLane(term) !== pill) return false;
      if (letter !== 'All' && letterOf(term) !== letter) return false;
      return true;
    });
    rows.sort((a, b) => {
      const labelA = getGlossaryLabel(a);
      const labelB = getGlossaryLabel(b);
      if (sort === 'za') return labelB.localeCompare(labelA);
      if (sort === 'beginner') {
        if (a.badge !== b.badge) return a.badge === 'Beginner' ? -1 : 1;
      }
      if (sort === 'intermediate') {
        if (a.badge !== b.badge) return a.badge === 'Intermediate' ? -1 : 1;
      }
      return labelA.localeCompare(labelB);
    });
    return rows;
  }, [query, pill, letter, sort]);

  return (
    <div className="terms-studio ts-dict">
      <header className="ts-dict-hero">
        <div>
          <p className="ts-kicker">Dictionary</p>
          <h1>Terms Studio</h1>
          <p className="ts-lede">Fast, simple definitions. Search, A–Z, then open one visual — the catalog does not load simulators.</p>
        </div>
        <p className="ts-dict-total">
          <strong>{termsStudioLessons.length}</strong>
          <span>terms</span>
        </p>
      </header>

      <label className="ts-dict-search">
        <Search size={16} />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search: learning rate, lr, gini, ROC, regularisation…"
          aria-label="Search terms"
        />
        <kbd>Ctrl</kbd>
        <kbd>K</kbd>
      </label>

      <div className="ts-dict-tools">
        <div className="ts-dict-pills" role="tablist" aria-label="Filter terms">
          {GLOSSARY_PILLS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={pill === item}
              className={pill === item ? 'is-on' : ''}
              onClick={() => setPill(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="ts-dict-sort">
          Sort:
          <select value={sort} onChange={(event) => setSort(event.target.value as GlossarySort)}>
            <option value="az">A – Z</option>
            <option value="za">Z – A</option>
            <option value="beginner">Beginner first</option>
            <option value="intermediate">Intermediate first</option>
          </select>
        </label>
      </div>

      <div className="ts-dict-az" aria-label="Jump to letter">
        <button type="button" className={letter === 'All' ? 'is-on' : ''} onClick={() => setLetter('All')}>
          All
        </button>
        {LETTERS.map((item) => {
          const ready = availableLetters.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={letter === item ? 'is-on' : ''}
              disabled={!ready}
              onClick={() => setLetter(item)}
            >
              {item}
            </button>
          );
        })}
        <span className="ts-dict-count">{filtered.length} terms</span>
      </div>

      <div className="ts-dict-grid">
        {filtered.map((term) => (
          <Link key={term.slug} to={termRoute(term.slug)} className="ts-dict-row" data-level={term.badge}>
            <header>
              <strong>{getGlossaryLabel(term)}</strong>
              <span>
                {term.badge} · {getGlossaryLane(term)}
              </span>
            </header>
            <em>{getGlossaryLine(term)}</em>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="ts-dict-empty">
          No terms match “{query || pill}”. Try relu, transformer, or token.
        </p>
      )}
    </div>
  );
}
