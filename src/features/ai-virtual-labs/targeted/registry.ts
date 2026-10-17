export const labSlugs = ['depth-limited-search','iterative-deepening-a-star','recursive-best-first-search','ao-star-search','csp-backtracking','forward-checking','ac-3-arc-consistency','min-conflicts','expectimax-search','variable-elimination','belief-propagation','particle-filtering','pomdp-belief-state-planning','monte-carlo-control','deep-q-network'] as const;
export type LabSlug = typeof labSlugs[number];
export const isTargetedAILab=(slug:string):slug is LabSlug=>labSlugs.includes(slug as LabSlug);
