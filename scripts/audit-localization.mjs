import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const inventory=JSON.parse(fs.readFileSync('reports/localization/inventory.json','utf8'));
const root='src/i18n/locales', errors=[], dictionaries={};
const placeholders=value=>[...value.matchAll(/\{\{\s*([^}]+)\s*\}\}/g)].map(m=>m[1]).sort().join('|');
function duplicateKeys(text,file) {
 const ast=ts.parseJsonText(file,text);
 const visit=node=>{
  if(ts.isObjectLiteralExpression(node)) {
   const keys=new Set(); for(const property of node.properties) if(property.name) {
    const name=property.name.text??property.name.getText(ast);
    if(keys.has(name)) errors.push(`${file}: duplicate ${name}`); keys.add(name);
   }
  } ts.forEachChild(node,visit);
 }; visit(ast);
}
for(const locale of fs.readdirSync(root)) {
 dictionaries[locale]={};
 for(const file of fs.readdirSync(path.join(root,locale)).filter(f=>f.endsWith('.json'))) {
  const location=path.join(root,locale,file),text=fs.readFileSync(location,'utf8');
  duplicateKeys(text,location);
  try { dictionaries[locale][file.slice(0,-5)]=JSON.parse(text); } catch(error) { errors.push(`${location}: ${error.message}`); }
 }
}
const seed=JSON.parse(fs.readFileSync('src/i18n/seed-translations.json','utf8'));
const localeSource=fs.readFileSync('src/i18n/languages.ts','utf8');
const configured=[...localeSource.matchAll(/\["([a-z]{2}(?:-[A-Z]{2})?)",/g)].map(m=>m[1]);
for(const locale of configured) if(!dictionaries[locale]) errors.push(`Missing configured locale ${locale}`);
for(const locale of Object.keys(dictionaries)) if(!configured.includes(locale)) errors.push(`Unconfigured locale ${locale}`);
const source=Object.assign({},...Object.values(dictionaries['en-IN'])), keys=Object.keys(source);
const used=new Set(inventory.modules.flatMap(module=>module.strings.filter(s=>s.phase==='phase1').map(s=>s.key)));
const report={routePatterns:inventory.routes.length,sourceModules:inventory.modules.length,
 renderableModules:inventory.modules.filter(module=>module.renderable).length,
 registeredRoutesWithoutSource:inventory.routes.filter(route=>!route.file),
 sourceKeyCount:keys.length,configuredLocaleCount:configured.length,
 phase2Candidates:inventory.modules.flatMap(module=>module.strings.filter(s=>s.phase!=='phase1').map(s=>({file:module.file,...s}))),
 unusedSourceKeys:keys.filter(key=>!used.has(key)),locales:{},errors};
const percentage=(n,d)=>d?Number((100*n/d).toFixed(2)):0;
for(const [locale,namespaces] of Object.entries(dictionaries)) {
 const merged=Object.assign({},...Object.values(namespaces));
 const translated=keys.filter(key=>typeof merged[key]==='string' && merged[key].length>0);
 const missing=keys.filter(key=>!translated.includes(key));
 for(const [namespace,dictionary] of Object.entries(namespaces)) for(const [key,value] of Object.entries(dictionary)) {
  if(!(key in source)) errors.push(`${locale}/${namespace}: unknown source key ${key}`);
  if(typeof value!=='string') errors.push(`${locale}/${namespace}/${key}: non-string translation`);
  else if(source[key] && placeholders(source[key])!==placeholders(value)) errors.push(`${locale}/${namespace}/${key}: broken placeholders`);
 }
 report.locales[locale]={status:locale==='en-IN'?'source-baseline':'draft-native-speaker-review-required',
  translatedKeys:translated.length,reviewedKeys:locale==='en-IN'?keys.length:0,
  dictionaryCoverage:percentage(translated.length,keys.length),reviewedCoverage:locale==='en-IN'?100:0,
  unchangedEnglish:translated.filter(key=>merged[key]===source[key]),missingKeys:missing,
  namespaces:Object.fromEntries(Object.entries(dictionaries['en-IN']).map(([namespace,base])=>[namespace,{
   sourceKeys:Object.keys(base).length,translatedKeys:Object.keys(base).filter(key=>merged[key]).length,
   coverage:percentage(Object.keys(base).filter(key=>merged[key]).length,Object.keys(base).length),
  }])),
  routes:inventory.routes.map(route=>({path:route.path,sourceKeys:route.sourceKeys.length,translatedKeys:route.sourceKeys.filter(key=>merged[key]).length,
   coverage:percentage(route.sourceKeys.filter(key=>merged[key]).length,route.sourceKeys.length),
   phase2Candidates:route.phase2Candidates,fullyTranslated:route.sourceKeys.length>0&&route.sourceKeys.every(key=>merged[key])})),
 };
}
fs.writeFileSync('reports/localization/coverage.json',JSON.stringify(report,null,2)+'\n');
const table=Object.entries(report.locales).map(([locale,row])=>`| ${locale} | ${row.translatedKeys} | ${row.dictionaryCoverage}% | ${row.reviewedCoverage}% | ${row.status} |`).join('\n');
const complete=Object.values(report.locales).filter(row=>row.reviewedCoverage===100).length;
fs.writeFileSync('LOCALIZATION_STATUS.md',`# Localization status\n\nPhase 1 is **partially implemented; translation completion is not claimed**.\n\n## Source inventory\n\n- ${report.routePatterns} registered route patterns audited from the actual TypeScript router (parameterized routes represent families of pages).\n- ${report.sourceModules} source modules scanned; ${report.renderableModules} TSX modules covered by the centralized JSX presentation lookup. This is infrastructure coverage, not a claim that every visible string is translated.\n- ${report.sourceKeyCount} source keys in namespace-based English JSON dictionaries. Original source wording is retained; default rendering returns original English strings unchanged.\n- ${report.configuredLocaleCount} configured locales: every code in the request is included; its list contains 41 codes, not 40.\n- ${report.phase2Candidates.length} long/technical/educational string candidates retained separately for Phase 2 or manual classification.\n- ${report.registeredRoutesWithoutSource.length} route patterns without resolved page source.\n\n## Dictionary coverage and review\n\n| Locale | Present keys | Dictionary coverage | Reviewed coverage | Status |\n|---|---:|---:|---:|---|\n${table}\n\nOnly the original English baseline is considered reviewed (${complete} locale). Target resources are authored drafts, not empty placeholders; retained technical English and fallback-only keys are not reviewed translations. No native-speaker sign-off has been obtained.\n\n## Implementation\n\n- i18next/react-i18next with namespace JSON loading based on the actual route's source dependency graph. No runtime translation service, IP detection or browser-language override.\n- One selector in each existing header variant, manual locale persistence, native labels, region grouping, search, selected state, keyboard navigation and Escape/focus return. Language changes do not remount route components.\n- Central JSX display adapter covers native text/accessible labels across existing TSX pages without rewriting control values, event handlers, data schemas, routes or algorithm code. Text derived dynamically is looked up at display time; unmapped text retains its original English.\n- Code, formulas, option values and table bodies retain technical text; JSX from third-party libraries is outside this adapter. ECharts titles, axis names and legend display formatters have a separate non-mutating adapter; series IDs/names and numerical arrays are preserved.\n- Arabic/Urdu document direction and script-aware fallbacks; technical regions, charts and tables retain LTR. No font downloads or third-party font calls.\n\n## Remaining work and defects\n\n1. Translate and linguistically review all missing keys listed per locale in [coverage.json](reports/localization/coverage.json). No non-English locale currently meets full Phase 1 acceptance.\n2. Manually classify dynamic template messages, interpolated UI fragments and words embedded in existing custom HTML/canvas/WebGL/iframe renderers; those are not comprehensively translated by the JSX layer.\n3. Preserve numerical chart keys while migrating remaining third-party custom tooltip formatters and Recharts labels; they currently fall back to English.\n4. Original dataset identifiers and technical table-body content remain deliberately untranslated. Interface labels inside mixed technical tables need explicit opt-in display labels.\n5. Full educational paragraph translation is Phase 2. Long descriptions and scientific expressions require manual classification; the source inventory is an audit candidate list, not a certification of automated classification.\n6. UI English regression and state-retention tests are recorded separately in [verification.md](reports/localization/verification.md). Automated structural checks do not establish native-language quality or certify every route visually.\n\n## Validation\n\nStructural errors: ${errors.length}. Exact missing keys, namespace percentages, route percentages, unchanged-English entries, unused source keys and Phase 2 candidates are in [coverage.json](reports/localization/coverage.json). Source occurrences and imported dependencies are in [inventory.json](reports/localization/inventory.json).\n`);
console.log(`${configured.length} locales, ${keys.length} source keys, ${inventory.routes.length} route patterns; ${errors.length} structural errors.`);
if(errors.length) { console.error(errors.slice(0,20).join('\n')); process.exitCode=1; }
