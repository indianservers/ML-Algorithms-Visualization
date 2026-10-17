import type {Frame,LabSlug} from './engines';
/** Zero-based lines in the displayed pseudocode, per engine operation. */
const operations:Record<LabSlug,Record<string,number>>={
 'depth-limited-search':{Ready:0,Expand:1,Cutoff:2,Backtrack:5,SUCCESS:6,CUTOFF:8,FAILURE:9},
 'iterative-deepening-a-star':{Ready:1,Prune:10,Expand:9,Backtrack:17,'Raise threshold':6,SUCCESS:4,FAILURE:5},
 'recursive-best-first-search':{Ready:0,Expand:2,Alternative:8,Backtrack:9,SUCCESS:12,CUTOFF:9,FAILURE:3},
 'ao-star-search':{Ready:1,Expand:4,Backup:8,SUCCESS:11},
 'csp-backtracking':{Ready:0,Assign:5,Conflict:4,Restore:7,SUCCESS:6,FAILURE:8},
 'forward-checking':{Ready:0,Assign:6,Conflict:4,Prune:7,Restore:9,SUCCESS:8,FAILURE:11},
 'ac-3-arc-consistency':{Ready:1,Revise:11,Enqueue:7,SUCCESS:8,FAILURE:5},
 'min-conflicts':{Ready:1,Evaluate:4,Move:6,SUCCESS:3,'STEP LIMIT':7},
 'expectimax-search':{Ready:0,Utility:1,Expectation:5,'Max backup':3,SUCCESS:3},
 'variable-elimination':{Ready:0,Restrict:1,Multiply:5,Marginalize:6,SUCCESS:9},
 'belief-propagation':{Ready:1,'Message pass':6,SUCCESS:11,'ITERATION LIMIT':11},
 'particle-filtering':{Ready:0,Prediction:1,Weight:3,Resample:7,SUCCESS:9},
 'pomdp-belief-state-planning':{Ready:0,Plan:2,'Bayes update':11,SUCCESS:7},
 'monte-carlo-control':{Ready:1,Episode:3,'Policy improvement':8,SUCCESS:9},
 'deep-q-network':{Ready:1,Train:10,'Episode complete':3,SUCCESS:11},
};
export const pseudocodeLine=(slug:LabSlug,f:Frame)=>operations[slug][f.phase]??0;
