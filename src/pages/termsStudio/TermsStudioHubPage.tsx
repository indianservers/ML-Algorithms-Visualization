import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, Search } from 'lucide-react';
import {
  categoryRoute,
  termCategories,
  termRoute,
  termsStudioLessons,
  termsStudioStartPath,
} from '../../data/termsStudio';
import { matchTermsStudioQuery } from '../../data/termsStudioEnhance';
import { getLearnedTerms, subscribeTermsProgress } from '../../lib/termsStudioProgress';
import './TermsStudio.css';

export default function TermsStudioHubPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | 'Beginner' | 'Intermediate'>('all');
  const [learnedOnly, setLearnedOnly] = useState(false);
  const [learned, setLearned] = useState<string[]>([]);

  useEffect(() => subscribeTermsProgress(() => setLearned(getLearnedTerms())), []);
  useEffect(() => { setLearned(getLearnedTerms()); }, []);

  const filtered = useMemo(() => {
    const matched = matchTermsStudioQuery(query);
    return matched.filter((term) => {
      if (level !== 'all' && term.badge !== level) return false;
      if (learnedOnly && !learned.includes(term.slug)) return false;
      return true;
    });
  }, [query, level, learnedOnly, learned]);

  const startDone = termsStudioStartPath.filter((slug) => learned.includes(slug)).length;

  return (
    <div className="terms-studio">
      <header className="ts-hero">
        <p className="ts-kicker">Special module</p>
        <h1>Terms Studio</h1>
        <p className="ts-lede">
          Machine learning is full of short words that hide simple ideas. This studio explains
          them the way you explain them to a friend: with a picture in the head, a tiny example,
          and a knob you can turn.
        </p>
      </header>

      <div className="ts-progress">
        <p>
          <strong>{learned.length}</strong> / {termsStudioLessons.length} marked learned
        </p>
        <i style={{ width: `${Math.round((learned.length / termsStudioLessons.length) * 100)}%` }} />
      </div>

      <label className="ts-search">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ReLU, dead neuron, leakage, qkv…"
          aria-label="Search terms"
        />
      </label>

      <div className="ts-filters">
        {(['all', 'Beginner', 'Intermediate'] as const).map((item) => (
          <button key={item} type="button" className={level === item ? 'is-on' : ''} onClick={() => setLevel(item)}>
            {item === 'all' ? 'All levels' : item}
          </button>
        ))}
        <button type="button" className={learnedOnly ? 'is-on' : ''} onClick={() => setLearnedOnly((value) => !value)}>
          Learned only
        </button>
      </div>

      {!query && (
        <section className="ts-start">
          <h2>Start here if you are new</h2>
          <p>
            Nine terms in a friendly order. {startDone} of {termsStudioStartPath.length} done.
          </p>
          <div className="ts-progress">
            <i style={{ width: `${Math.round((startDone / termsStudioStartPath.length) * 100)}%` }} />
          </div>
          <div className="ts-start-row">
            {termsStudioStartPath.map((slug, index) => {
              const term = termsStudioLessons.find((item) => item.slug === slug);
              if (!term) return null;
              return (
                <Link key={slug} to={termRoute(slug)} className={`ts-chip${learned.includes(slug) ? ' is-learned' : ''}`}>
                  {index + 1}. {term.label}
                  <ArrowRight size={14} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="ts-cats">
        {termCategories.map((category) => {
          const cards = filtered.filter((term) => term.category === category.id);
          if (cards.length === 0) return null;
          return (
            <section key={category.id} className="ts-cat">
              <h2>
                <Link to={categoryRoute(category.id)}>{category.title}</Link>
              </h2>
              <p>{category.blurb}</p>
              <div className="ts-grid">
                {cards.map((term) => (
                  <Link key={term.slug} to={termRoute(term.slug)} className={`ts-card${learned.includes(term.slug) ? ' is-learned' : ''}`}>
                    <span className="ts-level">{term.badge}{learned.includes(term.slug) ? ' · learned' : ''}</span>
                    <strong>{term.label}</strong>
                    <em>{term.blurb}</em>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="ts-lede">
          No term matches “{query}”. Try relu, dead neuron, leakage, or qkv.
        </p>
      )}

      {learned.length > 0 && (
        <section className="ts-recap">
          <h2>Recap pile</h2>
          <div className="ts-related">
            {termsStudioLessons.filter((term) => learned.includes(term.slug)).map((term) => (
              <Link key={term.slug} to={termRoute(term.slug)}>{term.label}</Link>
            ))}
          </div>
        </section>
      )}

      <p className="ts-lede" style={{ marginTop: 28 }}>
        <BookOpenText size={16} style={{ verticalAlign: 'middle' }} /> After a term clicks,
        jump into the linked lab and watch the same idea move on real data.
      </p>
    </div>
  );
}
