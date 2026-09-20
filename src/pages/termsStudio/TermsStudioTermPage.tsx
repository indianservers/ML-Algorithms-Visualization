import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Printer } from 'lucide-react';
import { Formula } from '../../components/common/Formula';
import {
  categoryRoute,
  getTermLesson,
  termCategories,
  termRoute,
  termsStudioLessons,
  TERMS_STUDIO_HUB_ROUTE,
  type TermLanguage,
} from '../../data/termsStudio';
import {
  getReadingNeighbors,
  getTermEnhance,
  smarterRelated,
} from '../../data/termsStudioEnhance';
import {
  getTermsLanguage,
  isTermLearned,
  setTermsLanguage,
  subscribeTermsProgress,
  toggleTermLearned,
} from '../../lib/termsStudioProgress';
import './TermsStudio.css';

const TermDemo = lazy(() =>
  import('../../components/termsStudio/TermDemos').then((mod) => ({ default: mod.TermDemo })),
);

export default function TermsStudioTermPage() {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug ?? location.pathname.split('/').filter(Boolean).pop() ?? '';
  const term = getTermLesson(slug);
  const [lang, setLang] = useState<TermLanguage>(getTermsLanguage);
  const [learned, setLearned] = useState(false);
  const [quizPick, setQuizPick] = useState<Array<number | null>>([null, null, null]);

  useEffect(() => {
    setLearned(isTermLearned(slug));
    setQuizPick([null, null, null]);
    return subscribeTermsProgress(() => setLearned(isTermLearned(slug)));
  }, [slug]);

  if (!term) {
    return <Navigate to={TERMS_STUDIO_HUB_ROUTE} replace />;
  }

  const extra = getTermEnhance(term);
  const category = termCategories.find((item) => item.id === term.category);
  const related = smarterRelated(term).slice(0, 5);
  const { prev, next } = getReadingNeighbors(term.slug);
  const hook = lang === 'hindi' ? extra.hindi.hook : lang === 'simple' ? extra.simple.hook : term.hook;
  const analogy = lang === 'hindi' ? extra.hindi.analogy : lang === 'simple' ? extra.simple.analogy : term.analogy;
  const explanation = lang === 'simple' ? extra.simple.explanation : term.explanation;
  const sixty = lang === 'hindi' ? extra.hindi.sixty : extra.sixty;
  const ideas = [...new Set([sixty.what, sixty.why, ...explanation].filter(Boolean))]
    .filter((item) => item !== term.blurb)
    .slice(0, 4);
  const caption = extra.diagramCaption?.startsWith('This demo is the picture') ? undefined : extra.diagramCaption;

  const changeLang = (nextLang: TermLanguage) => {
    setLang(nextLang);
    setTermsLanguage(nextLang);
  };

  return (
    <div className="terms-studio ts-print ts-term-page">
      <nav className="ts-crumb">
        <Link to={TERMS_STUDIO_HUB_ROUTE}>Terms Studio</Link>
        <span>/</span>
        {category && <Link to={categoryRoute(category.id)}>{category.title}</Link>}
        <span>/</span>
        <span>{term.label}</span>
      </nav>

      <div className="ts-lang" role="group" aria-label="Language">
        {([
          ['default', 'Default'],
          ['simple', 'Simpler'],
          ['hindi', 'हिंदी'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={lang === id ? 'is-on' : ''} onClick={() => changeLang(id)}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => window.print()}>
          <Printer size={14} /> One-pager
        </button>
        <button
          type="button"
          className={learned ? 'is-on' : ''}
          onClick={() => setLearned(toggleTermLearned(term.slug).includes(term.slug))}
        >
          <Check size={14} /> {learned ? 'Learned' : 'Mark learned'}
        </button>
      </div>

      <header className="ts-term-hero">
        <p className="ts-kicker">{term.badge} · {category?.title}</p>
        <h1>{term.label}</h1>
        {hook && hook !== term.blurb ? <p className="ts-hook">{hook}</p> : null}
        <p className="ts-one-line">{term.blurb}</p>
      </header>

      <section id="try" className="ts-panel ts-visual">
        <h2>What it looks like</h2>
        <Suspense fallback={<p className="ts-demo-readout">Loading visual…</p>}>
          <TermDemo
            kind={term.demo.kind}
            variant={term.demo.variant}
            caption={caption}
            unitsNote={extra.unitsNote}
          />
          {term.slug === 'relu' && (
            <TermDemo kind="overlay-activation" caption="Same x-axis. Toggle cousins to see where ReLU, leaky ReLU, and sigmoid disagree." />
          )}
          {term.slug === 'mse-mae-huber' && (
            <TermDemo kind="overlay-loss" caption="Same residual. MSE shouts at outliers, MAE stays linear, Huber switches in the middle." />
          )}
        </Suspense>
      </section>

      <section className="ts-panel">
        <h2>Key idea</h2>
        <ul className="ts-key-ideas">
          {ideas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {analogy && analogy !== term.blurb && <p className="ts-take">{analogy}</p>}
      </section>

      {term.formula && (
        <section className="ts-panel">
          <h2>Formula</h2>
          <div className="ts-formula">
            <Formula value={term.formula} block explanation={term.formulaPlain} />
            {term.formulaPlain && <small>{term.formulaPlain}</small>}
          </div>
        </section>
      )}

      {term.labLinks.length > 0 && (
        <section className="ts-panel">
          <h2>Used in</h2>
          <div className="ts-related">
            {term.labLinks.map((link) => (
              <Link key={link.route} to={link.route}>{link.label}</Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="ts-panel">
          <h2>Related terms</h2>
          <div className="ts-related">
            {related.map((item) => (
              <Link key={item.slug} to={termRoute(item.slug)}>{item.label}</Link>
            ))}
          </div>
        </section>
      )}

      <details className="ts-more">
        <summary>More examples and a short quiz</summary>
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
        <section className="ts-panel">
          <h2>Three quick checks</h2>
          {extra.quiz.map((item, index) => (
            <div key={item.q} className="ts-quiz">
              <p>{item.q}</p>
              <div className="ts-choice">
                {item.choices.map((choice, choiceIndex) => {
                  const picked = quizPick[index];
                  const revealed = picked !== null && picked !== undefined;
                  const correct = choiceIndex === item.answer;
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={revealed && correct ? 'is-on' : revealed && picked === choiceIndex ? 'is-off' : ''}
                      onClick={() => setQuizPick((current) => current.map((value, i) => (i === index ? choiceIndex : value)))}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {quizPick[index] !== null && quizPick[index] !== undefined && (
                <p className="ts-take">{extra.quiz[index]?.why}</p>
              )}
            </div>
          ))}
        </section>
        <section className="ts-panel">
          <h2>Watch for</h2>
          <p>{term.watchFor}</p>
        </section>
      </details>

      <RecapStrip current={term.slug} />

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

function RecapStrip({ current }: { current: string }) {
  const learned = termsStudioLessons.filter((term) => isTermLearned(term.slug));
  if (learned.length === 0) return null;
  return (
    <section className="ts-recap">
      <h2>Your recap</h2>
      <p>{learned.length} term{learned.length === 1 ? '' : 's'} marked learned{learned.some((term) => term.slug === current) ? ', including this page' : ''}.</p>
      <div className="ts-related">
        {learned.slice(-6).map((term) => (
          <Link key={term.slug} to={termRoute(term.slug)}>{term.label}</Link>
        ))}
      </div>
    </section>
  );
}
