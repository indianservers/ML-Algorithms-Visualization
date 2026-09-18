import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FlaskConical, Printer } from 'lucide-react';
import { Formula } from '../../components/common/Formula';
import { TermDemo } from '../../components/termsStudio/TermDemos';
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

const toc = [
  { id: 'sixty', label: '60 seconds' },
  { id: 'try', label: 'Try it' },
  { id: 'explain', label: 'Plain English' },
  { id: 'example', label: 'Examples' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'compare', label: 'Compare' },
] as const;

export default function TermsStudioTermPage() {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug ?? location.pathname.split('/').filter(Boolean).pop() ?? '';
  const term = getTermLesson(slug);
  const [lang, setLang] = useState<TermLanguage>(getTermsLanguage);
  const [learned, setLearned] = useState(false);
  const [quizPick, setQuizPick] = useState<Array<number | null>>([null, null, null]);
  const [compareSlug, setCompareSlug] = useState('');

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
  const related = smarterRelated(term);
  const { prev, next } = getReadingNeighbors(term.slug);
  const compareTerm = compareSlug ? getTermLesson(compareSlug) : undefined;
  const compareExtra = compareTerm ? getTermEnhance(compareTerm) : undefined;

  const hook = lang === 'hindi' ? extra.hindi.hook : lang === 'simple' ? extra.simple.hook : term.hook;
  const analogy = lang === 'hindi' ? extra.hindi.analogy : lang === 'simple' ? extra.simple.analogy : term.analogy;
  const explanation = lang === 'simple' ? extra.simple.explanation : term.explanation;
  const sixty = lang === 'hindi' ? extra.hindi.sixty : extra.sixty;
  const meeting = lang === 'hindi' ? extra.hindi.meetingLine : extra.meetingLine;

  const changeLang = (nextLang: TermLanguage) => {
    setLang(nextLang);
    setTermsLanguage(nextLang);
  };

  return (
    <div className="terms-studio ts-print">
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
        <p className="ts-hook">{hook}</p>
        <p className="ts-meeting">{meeting}</p>
      </header>

      <nav className="ts-toc" aria-label="On this page">
        {toc.map((item) => (
          <a key={item.id} href={`#${item.id}`}>{item.label}</a>
        ))}
      </nav>

      <section id="sixty" className="ts-sixty">
        <h2>The 60-second version</h2>
        <div className="ts-sixty-grid">
          <div><em>What</em><p>{sixty.what}</p></div>
          <div><em>Why</em><p>{sixty.why}</p></div>
          <div><em>Remember</em><p>{sixty.remember}</p></div>
        </div>
        <p className="ts-remember"><strong>{extra.rememberNumber.label}:</strong> {extra.rememberNumber.value}</p>
      </section>

      <div className="ts-analogy-card">
        <h2>Think of it like this</h2>
        <p>{analogy}</p>
      </div>

      <div className="ts-layout">
        <div className="ts-stack">
          <section id="explain" className="ts-panel">
            <h2>In plain English</h2>
            {explanation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section id="try" className="ts-panel">
            <h2>Try it</h2>
            <TermDemo
              kind={term.demo.kind}
              variant={term.demo.variant}
              caption={extra.diagramCaption}
              unitsNote={extra.unitsNote}
            />
            {term.slug === 'relu' && (
              <TermDemo kind="overlay-activation" caption="Same x-axis. Toggle cousins to see where ReLU, leaky ReLU, and sigmoid disagree." />
            )}
            {term.slug === 'mse-mae-huber' && (
              <TermDemo kind="overlay-loss" caption="Same residual. MSE shouts at outliers, MAE stays linear, Huber switches in the middle." />
            )}
          </section>

          {extra.symbols.length > 0 && (
            <section className="ts-panel">
              <h2>How to say the symbols</h2>
              <ul className="ts-symbols">
                {extra.symbols.map((item) => (
                  <li key={item.symbol}>
                    <strong>{item.symbol}</strong> — say “{item.say}”. {item.means}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="example" className="ts-panel">
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
            <h2>Another example: {extra.secondExample.title}</h2>
            <p>{extra.secondExample.setup}</p>
            <ol className="ts-steps">
              {extra.secondExample.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="ts-take">{extra.secondExample.takeaway}</p>
          </section>

          <section className="ts-panel">
            <h2>{extra.wrongWalkthrough.title}</h2>
            <p>{extra.wrongWalkthrough.setup}</p>
            <ol className="ts-steps">
              {extra.wrongWalkthrough.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="ts-take">{extra.wrongWalkthrough.takeaway}</p>
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

          <section id="quiz" className="ts-panel">
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

          <section className="ts-side-card">
            <h2>In this app</h2>
            <p>{extra.inThisApp}</p>
          </section>

          <section className="ts-side-card">
            <h2>Before / after</h2>
            <p><strong>Before:</strong> {extra.beforeAfter.before}</p>
            <p><strong>After:</strong> {extra.beforeAfter.after}</p>
          </section>

          <section className="ts-side-card">
            <h2>Myth vs fact</h2>
            {extra.myths.map((item) => (
              <p key={item.myth}><strong>Myth:</strong> {item.myth}<br /><strong>Fact:</strong> {item.fact}</p>
            ))}
          </section>

          <section className="ts-side-card">
            <h2>Easy mix-ups</h2>
            {extra.mixups.map((item) => (
              <p key={item.other}>
                {item.otherSlug ? <Link to={termRoute(item.otherSlug)}>{item.other}</Link> : <strong>{item.other}</strong>}
                {' — '}{item.vs}
              </p>
            ))}
          </section>

          <section id="compare" className="ts-side-card">
            <h2>Compare two</h2>
            <select value={compareSlug} onChange={(event) => setCompareSlug(event.target.value)} aria-label="Compare with">
              <option value="">Pick a neighbor…</option>
              {[...extra.compareWith, ...term.related].filter((item, i, all) => all.indexOf(item) === i).map((item) => {
                const other = getTermLesson(item);
                return other ? <option key={item} value={item}>{other.label}</option> : null;
              })}
            </select>
            {compareTerm && compareExtra && (
              <div className="ts-compare">
                <div>
                  <strong>{term.label}</strong>
                  <p>{extra.sixty.what}</p>
                </div>
                <div>
                  <strong>{compareTerm.label}</strong>
                  <p>{compareExtra.sixty.what}</p>
                </div>
              </div>
            )}
          </section>

          <section className="ts-side-card">
            <h2>Classroom script</h2>
            <ol className="ts-steps">
              {extra.classroomScript.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </section>

          {extra.vocab.length > 0 && (
            <section className="ts-side-card">
              <h2>Vocab</h2>
              {extra.vocab.map((item) => (
                <p key={item.word}><strong>{item.word}:</strong> {item.def}</p>
              ))}
            </section>
          )}

          {related.length > 0 && (
            <section className="ts-side-card">
              <h2>Read these next</h2>
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
