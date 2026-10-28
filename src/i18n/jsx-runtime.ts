import {
  createContext,
  useContext,
  isValidElement,
  type ReactNode,
  type ElementType,
} from "react";
import {
  jsx as reactJsx,
  jsxs as reactJsxs,
  Fragment,
} from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { i18n, translateText } from "./config";
import { isInterfaceText } from "./keys";
import { LocalizedChart } from "./LocalizedChart";
import { LocalizedFrame } from "./LocalizedFrame";
import { LocalizedRecharts } from "./LocalizedRecharts";
import { ResponsiveContainer } from 'recharts';
import { Link, NavLink } from "react-router-dom";
export { Fragment };
export type { JSX } from "react";
const ProtectedText = createContext(false);
const attributes = ["title", "placeholder", "aria-label", "alt"];
type Props = Record<string, unknown> & { children?: ReactNode; __tag?: string };
function originalText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(originalText).join("");
  if (isValidElement<{ children?: ReactNode }>(value))
    return originalText(value.props.children);
  return "";
}
function translateChildren(value: ReactNode): ReactNode {
  return typeof value === "string"
    ? translateText(value)
    : Array.isArray(value)
      ? value.map(translateChildren)
      : value;
}
/** Router links create their anchor inside a library, outside the app's JSX transform. */
function LocalizedNavigation({ component, original }: { component: ElementType; original: Record<string, unknown> }) {
  useTranslation("common", { i18n, useSuspense: false });
  const protectedHere = useContext(ProtectedText) || Boolean(original["data-i18n-protect"]);
  const props = { ...original };
  if (!protectedHere) {
    const child = original.children;
    props.children = typeof child === "function"
      ? (...args: unknown[]) => translateChildren(child(...args))
      : translateChildren(child as ReactNode);
    for (const attribute of attributes) if (typeof props[attribute] === "string") props[attribute] = translateText(props[attribute] as string);
  }
  const source = originalText(original.children as ReactNode);
  if (source) props["data-i18n-source"] = source;
  return reactJsx(component, props);
}
function LocalizedElement({ __tag: tag = "span", ...original }: Props) {
  useTranslation("common", { i18n, useSuspense: false });
  const inherited = useContext(ProtectedText);
  const protectedHere =
    inherited ||
    Boolean(original["data-i18n-protect"]) ||
    ["pre", "code", "kbd", "textarea", "math", "tbody"].includes(tag) ||
    /(?:formula|equation|monospace|code-editor)/.test(
      String(original.className ?? ""),
    ) ||
    (tag === "option" && (original.value === undefined || original.value === original.children));
  const props = { ...original };
  if (!protectedHere) {
    props.children = translateChildren(original.children);
    for (const attribute of attributes)
      if (typeof props[attribute] === "string")
        props[attribute] = translateText(props[attribute] as string);
  }
  const source = originalText(original.children);
  if (
    source &&
    [
      "button",
      "a",
      "label",
      "span",
      "small",
      "b",
      "strong",
      "h3",
      "section",
    ].includes(tag)
  )
    props["data-i18n-source"] = source;
  const element = reactJsx(tag as ElementType, props);
  return protectedHere !== inherited
    ? reactJsx(ProtectedText.Provider, {
        value: protectedHere,
        children: element,
      })
    : element;
}
function needsLocalization(type: unknown, props: Props | null) {
  if (
    typeof type !== "string" ||
    !props ||
    (type === "input" && props.type === "hidden")
  )
    return false;
  if (["button", "a", "label"].includes(type)) return true;
  return (
    ["pre", "code", "kbd", "textarea", "math", "tbody"].includes(type) ||
    Boolean(props["data-i18n-protect"]) ||
    (type === "option" && (props.value === undefined || props.value === props.children)) ||
    /(?:formula|equation|monospace|code-editor)/.test(
      String(props.className ?? ""),
    ) ||
    attributes.some(
      (attribute) =>
        typeof props[attribute] === "string" &&
        isInterfaceText(props[attribute] as string),
    ) ||
    (typeof props.children === "string" && isInterfaceText(props.children)) ||
    (Array.isArray(props.children) &&
      props.children.some(
        (value) => typeof value === "string" && isInterfaceText(value),
      ))
  );
}
export function jsx(type: ElementType, props: Props | null, key?: string) {
  if (type === ResponsiveContainer) return reactJsx(LocalizedRecharts, {component:type, original:props ?? {}}, key);
  if (type === 'iframe') return props?.['data-i18n-frame-managed'] ? reactJsx(type, props, key) : reactJsx(LocalizedFrame, { original: props ?? {} }, key);
  if (type === Link || type === NavLink) return reactJsx(LocalizedNavigation, { component: type, original: props ?? {} }, key);
  if (
    typeof type !== "string" &&
    props?.option &&
    !props.__i18nManaged &&
    typeof (type as { prototype?: { getEchartsInstance?: unknown } }).prototype?.getEchartsInstance === "function"
  )
    return reactJsx(LocalizedChart, { component: type, original: props }, key);
  return needsLocalization(type, props)
    ? reactJsx(LocalizedElement, { ...props, __tag: type as string }, key)
    : reactJsx(type, props, key);
}
export const jsxs = (type: ElementType, props: Props | null, key?: string) =>
  needsLocalization(type, props)
    ? reactJsxs(LocalizedElement, { ...props, __tag: type as string }, key)
    : jsx(type, props, key);
