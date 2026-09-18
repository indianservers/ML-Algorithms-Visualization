import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  categoryRoute,
  getTermLesson,
  termCategories,
  termRoute,
  termsStudioLessons,
  TERMS_STUDIO_HUB_ROUTE,
  type TermCategoryId,
} from '../../data/termsStudio';
import { categoryStories } from '../../data/termsStudioEnhance';
import { getLearnedTerms, subscribeTermsProgress } from '../../lib/termsStudioProgress';
import './TermsStudio.css';

const categoryIds = new Set(termCategories.map((item) => item.id));

export default function TermsStudioCategoryPage() {
  const params = useParams();
  const location = useLocation();
  const id = (params.id ?? location.pathname.split('/').filter(Boolean).pop() ?? '') as TermCategoryId;
  const category = termCategories.find((item) => item.id === id);
  const [learned, setLearned] = useState<string[]>([]);

  useEffect(() => subscribeTermsProgress(() => setLearned(getLearnedTerms())), []);
  useEffect(() => { setLearned(getLearnedTerms()); }, []);

  if (!category || !categoryIds.has(id)) {
    return <Navigate to={TERMS_STUDIO_HUB_ROUTE} replace />;
  }

  const story = categoryStories[id];
  const cards = termsStudioLessons.filter((term) => term.category === id);
  const done = cards.filter((term) => learned.includes(term.slug)).length;

  return (
    <div className="terms-studio">
      <nav className="ts-crumb">
        <Link to={TERMS_STUDIO_HUB_ROUTE}>Terms Studio</Link>
        <span>/</span>
        <span>{category.title}</span>
      </nav>

      <header className="ts-term-hero">
        <p className="ts-kicker">Topic path</p>
        <h1>{category.title}</h1>
        <p className="ts-hook">{story.story}</p>
        <p className="ts-meeting">{story.minutes}</p>
      </header>

      <div className="ts-progress">
        <p><strong>{done}</strong> / {cards.length} learned in this topic</p>
        <i style={{ width: `${Math.round((done / Math.max(cards.length, 1)) * 100)}%` }} />
      </div>

      <section className="ts-start">
        <h2>Read in this order</h2>
        <div className="ts-start-row">
          {story.sequence.map((slug, index) => {
            const term = getTermLesson(slug);
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

      <div className="ts-grid">
        {cards.map((term) => (
          <Link key={term.slug} to={termRoute(term.slug)} className={`ts-card${learned.includes(term.slug) ? ' is-learned' : ''}`}>
            <span className="ts-level">{term.badge}</span>
            <strong>{term.label}</strong>
            <em>{term.blurb}</em>
          </Link>
        ))}
      </div>

      <div className="ts-nav-terms" style={{ marginTop: 22 }}>
        {termCategories.map((item) => (
          <Link key={item.id} to={categoryRoute(item.id)} className={item.id === id ? 'is-learned' : ''}>
            {item.title}
          </Link>
        ))}
        <Link to={TERMS_STUDIO_HUB_ROUTE}>All terms</Link>
      </div>
    </div>
  );
}
