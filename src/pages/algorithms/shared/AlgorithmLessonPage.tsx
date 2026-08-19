import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Play, Sparkles } from 'lucide-react';
import { Card, InfoBox } from '../../../components/common/Card';
import { PageHeader } from '../../../components/common/PageHeader';
import { getAlgorithmByRoute } from '../../../data/implementationStatus';
import { getLearningContent } from '../../../data/learningContent';

export default function AlgorithmLessonPage() {
  const { group, slug, pageNumber } = useParams();
  const baseRoute = `/ml/${group ?? ''}/${slug ?? ''}`;
  const algorithm = getAlgorithmByRoute(baseRoute);
  const pageIndex = Number(pageNumber ?? '1') - 1;
  const content = React.useMemo(() => getLearningContent(baseRoute), [baseRoute]);
  const lesson = content.lessons[pageIndex];

  if (!algorithm || !lesson) return <Navigate to="/404" replace />;

  const previous = content.lessons[pageIndex - 1];
  const next = content.lessons[pageIndex + 1];

  return (
    <div>
      <PageHeader
        title={`${algorithm.label} Lesson ${lesson.pageNumber}`}
        subtitle={lesson.title}
        badge={algorithm.badge}
        category={algorithm.category}
        icon={<BookOpen size={22} />}
        showAlgorithmIntro={false}
        showAlgorithmTools={false}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link to={baseRoute} className="inline-flex min-h-10 items-center gap-2 rounded border border-gray-200 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900">
          <ArrowLeft size={13} /> Algorithm
        </Link>
        {content.lessons.map(item => (
          <Link
            key={item.pageNumber}
            to={`${baseRoute}/lessons/${item.pageNumber}`}
            className={`inline-flex min-h-10 items-center rounded border px-3 py-2 font-bold ${item.pageNumber === lesson.pageNumber ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900'}`}
          >
            Page {item.pageNumber}
          </Link>
        ))}
      </div>

      <Card title={lesson.title} subtitle={`Page ${lesson.pageNumber} of ${content.lessons.length}`} icon={<BookOpen size={15} />}>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <InfoBox type="info" title="Story">{lesson.story}</InfoBox>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Lightbulb size={13} /> Simple Explanation
              </p>
              {lesson.simpleExplanation}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4 text-sm leading-7 text-gray-700 dark:border-gray-700 dark:text-gray-200">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Play size={13} /> Realtime Example
              </p>
              {lesson.realtimeExample}
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <Sparkles size={13} /> Realtime Applications
              </p>
              <div className="flex flex-wrap gap-2">
                {lesson.realtimeApplications.map(application => (
                  <span key={application} className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">{application}</span>
                ))}
              </div>
            </div>

            <InfoBox type="success" title="Teacher Tip">{lesson.teacherTip}</InfoBox>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
        {previous ? (
          <Link to={`${baseRoute}/lessons/${previous.pageNumber}`} className="inline-flex min-h-10 items-center gap-2 rounded border border-gray-200 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900">
            <ArrowLeft size={13} /> Page {previous.pageNumber}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`${baseRoute}/lessons/${next.pageNumber}`} className="inline-flex min-h-10 items-center gap-2 rounded bg-blue-600 px-3 py-2 font-semibold text-white">
            Page {next.pageNumber} <ArrowRight size={13} />
          </Link>
        ) : (
          <Link to={baseRoute} className="inline-flex min-h-10 items-center gap-2 rounded bg-blue-600 px-3 py-2 font-semibold text-white">
            Back to Algorithm <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
