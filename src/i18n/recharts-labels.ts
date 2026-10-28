import { cloneElement, isValidElement, type ReactNode } from 'react';
import { translateText } from './config';

/** Recharts uses component identities and dataKey to discover its series. Keep
 * both intact; only adapt labels and formatter return values at the chart root. */
export function localizeRechartsChildren(children: ReactNode): ReactNode {
  if(Array.isArray(children))return children.map(localizeRechartsChildren);
  const child=children;
    if (!isValidElement<Record<string, unknown>>(child)) return child;
    const props = {...child.props};
    const displayName = (child.type as {displayName?: string}).displayName ?? '';
    for (const field of ['name', 'unit']) if (typeof props[field] === 'string') props[field] = translateText(props[field]);
    if (typeof props.label === 'string') props.label = translateText(props.label);
    else if (props.label && typeof props.label === 'object' && !isValidElement(props.label)) {
      const label = props.label as Record<string, unknown>;
      if (typeof label.value === 'string') props.label = {...label, value:translateText(label.value)};
    }
    if (displayName === 'Legend') {
      const formatter = props.formatter;
      props.formatter = (...args: unknown[]) => {
        const value = typeof formatter === 'function' ? formatter(...args) : args[0];
        return typeof value === 'string' ? translateText(value) : value;
      };
    }
    if (displayName === 'Tooltip') {
      const formatter = props.formatter, labelFormatter = props.labelFormatter;
      props.formatter = (...args: unknown[]) => {
        const value = typeof formatter === 'function' ? formatter(...args) : [args[0], args[1]];
        return Array.isArray(value) ? [value[0], typeof value[1] === 'string' ? translateText(value[1]) : value[1]] : value;
      };
      props.labelFormatter = (...args: unknown[]) => {
        const value = typeof labelFormatter === 'function' ? labelFormatter(...args) : args[0];
        return typeof value === 'string' ? translateText(value) : value;
      };
    }
    if (props.children) props.children = localizeRechartsChildren(props.children as ReactNode);
    return cloneElement(child, props);
}
