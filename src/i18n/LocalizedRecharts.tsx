import { type ElementType, type ReactNode } from 'react';
import { jsx as nativeJsx } from 'react/jsx-runtime';
import { useTranslation } from 'react-i18next';
import { i18n } from './config';
import { localizeRechartsChildren } from './recharts-labels';

export function LocalizedRecharts({component, original}: {component:ElementType; original:Record<string,unknown>}) {
  useTranslation('common', {i18n, useSuspense:false});
  const children=original.children;
  return nativeJsx(component, {...original, children:i18n.language === 'en-IN' ? children : typeof children === 'function' ? (...args:unknown[])=>localizeRechartsChildren(children(...args)) : localizeRechartsChildren(children as ReactNode)});
}
