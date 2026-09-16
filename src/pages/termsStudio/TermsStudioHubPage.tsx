import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, Search } from 'lucide-react';
import {
  termCategories,
  termRoute,
  termsStudioLessons,
  termsStudioStartPath,
} from '../../data/termsStudio';
import './TermsStudio.css';

export default function TermsStudioHubPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return termsStudioLessons;
    return termsStudioLessons.filter((term) => {
      const hay = [term.label, term.blurb, term.analogy, ...term.synonyms, ...term.tags].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [query]);

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

      <label className="ts-search">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ReLU, loss, softmax, epoch..."
          aria-label="Search terms"
        />
      </label>

      {!query && (
        <section className="ts-start">
          <h2>Start here if you are new</h2>
          <p>Nine terms in a friendly order. Read them like a short story.</p>
          <div className="ts-start-row">
            {termsStudioStartPath.map((slug, index) => {
              const term = termsStudioLessons.find((item) => item.slug === slug);
              if (!term) return null;
              return (
                <Link key={slug} to={termRoute(slug)} className="ts-chip">
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
              <h2>{category.title}</h2>
              <p>{category.blurb}</p>
              <div className="ts-grid">
                {cards.map((term) => (
                  <Link key={term.slug} to={termRoute(term.slug)} className="ts-card">
                    <span className="ts-level">{term.badge}</span>
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
          No term matches “{query}”. Try relu, gradient, dropout, or softmax.
        </p>
      )}

      <p className="ts-lede" style={{ marginTop: 28 }}>
        <BookOpenText size={16} style={{ verticalAlign: 'middle' }} /> After a term clicks,
        jump into the linked lab and watch the same idea move on real data.
      </p>
    </div>
  );
}
