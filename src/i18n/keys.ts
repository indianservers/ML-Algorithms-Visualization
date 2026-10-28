/** Stable, locale-independent keys. The audit rejects hash collisions. */
export function keyFor(source: string) {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++)
    hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return `s_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
export function isInterfaceText(value: string) {
  const source = value.trim();
  return (
    source.length > 1 &&
    source.length <= 4000 &&
    /[A-Za-z]{2}/.test(source) &&
    !/^(https?:|www\.|\/|#[\w-]|[\w]+_[\w_]+$)/.test(source) &&
    !/[=∑∂∇]|=>|\b(?:const|function|return|import)\s|[<>]/.test(source.replace(/\{\{v\d+\}\}/g, ""))
  );
}
