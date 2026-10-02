import { algorithmCatalogSearchMeta } from './algorithmCatalogSearchMeta';
import { termsStudioSearchMeta } from './termsStudio';

export { categorySearchMeta } from './algorithmCatalogSearchMeta';
export type { AlgorithmSearchMeta, CategorySearchMeta } from './algorithmCatalogSearchMeta';

// Combine the hand-authored algorithm metadata with the Terms Studio catalog.
// Term generation imports only algorithmCatalogSearchMeta, avoiding a cycle.
export const algorithmSearchMeta = {
  ...algorithmCatalogSearchMeta,
  ...termsStudioSearchMeta,
};
