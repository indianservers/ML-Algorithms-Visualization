import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FlaskConical } from 'lucide-react';
import { Formula } from '../../components/common/Formula';
import { TermDemo } from '../../components/termsStudio/TermDemos';
import {
  getNeighborTerms,
  getRelatedTerms,
  getTermLesson,
  termCategories,
  termRoute,
  TERMS_STUDIO_HUB_ROUTE,
} from '../../data/termsStudio';
import './TermsStudio.css';

export default function TermsStudioTermPage() {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug ?? location.pathname.split('/').filter(Boolean).pop() ?? '';
  const term = getTermLesson(slug);
  if (!term) {
    return <Navigate to={TERMS_STUDIO_HUB_ROUTE} replace />;
  }

  const category = termCategories.find((item) => item.id === term.category);
  const related = getRelatedTerms(term);
  const { prev, next } = getNeighborTerms(term.slug);

  return (
    <div className="terms-studio">
      <nav className="ts-crumb">
        <Link to={TERMS_STUDIO_HUB_ROUTE}>Terms Studio</Link>
        <span>/</span>
        <span>{category?.title}</span>
        <span>/</span>
        <span>{term.label}</span>
      </nav>

      <header className="ts-term-hero">
        <p className="ts-kicker">{term.badge} · {category?.title}</p>
        <h1>{term.label}</h1>
        <p className="ts-hook">{term.hook}</p>
      </header>

      <div className="ts-analogy-card">
        <h2>Think of it like this</h2>
        <p>{term.analogy}</p>
      </div>

      <div className="ts-layout">
        <div className="ts-stack">
          <section className="ts-panel">
            <h2>In plain English</h2>
            {term.explanation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="ts-panel">
            <h2>Try it</h2>
            <TermDemo kind={term.demo.kind} variant={term.demo.variant} />
          </section>

          <section className="ts-panel">
            <h2>{term.workedExample.title}</h2>
            <p>{term.workedExample.setup}</p>
            <ol className="ts-steps">
              {term.workedExample.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="ts-take">{term.workedExample.takeaway}</p>
          </section>

          {term.formula && (
            <section className="ts-panel">
              <h2>The formula, then the English</h2>
              <div className="ts-formula">
                <Formula value={term.formula} block explanation={term.formulaPlain} />
                {term.formulaPlain && <small>{term.formulaPlain}</small>}
              </div>
            </section>
          )}
        </div>

        <aside className="ts-stack">
          <section className="ts-try">
            <h2>Do this next</h2>
            <ul>
              {term.tryThis.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="ts-side-card">
            <h2>When to use it</h2>
            <p>{term.whenToUse}</p>
          </section>

          <section className="ts-side-card">
            <h2>Watch for</h2>
            <p>{term.watchFor}</p>
          </section>

          {related.length > 0 && (
            <section className="ts-side-card">
              <h2>Related terms</h2>
              <div className="ts-related">
                {related.map((item) => (
                  <Link key={item.slug} to={termRoute(item.slug)}>{item.label}</Link>
                ))}
              </div>
            </section>
          )}

          <section className="ts-side-card">
            <h2><FlaskConical size={16} /> Open a lab</h2>
            <div className="ts-labs">
              {term.labLinks.map((link) => (
                <Link key={link.route} to={link.route}>{link.label}</Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="ts-nav-terms" style={{ marginTop: 22 }}>
        {prev ? (
          <Link to={termRoute(prev.slug)}>
            <ArrowLeft size={14} /> {prev.label}
          </Link>
        ) : <span />}
        <Link to={TERMS_STUDIO_HUB_ROUTE}>All terms</Link>
        {next ? (
          <Link to={termRoute(next.slug)}>
            {next.label} <ArrowRight size={14} />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
