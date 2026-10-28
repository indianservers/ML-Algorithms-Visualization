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
 const translatedSet=new Set(translated);
 const missing=keys.filter(key=>!translatedSet.has(key));
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
fs.writeFileSync('reports/localization/coverage.json',JSON.stringify(report)+'\n');
const table=Object.entries(report.locales).map(([locale,row])=>`| ${locale} | ${row.translatedKeys} | ${row.dictionaryCoverage}% | ${row.reviewedCoverage}% | ${row.status} |`).join('\n');
const complete=Object.values(report.locales).filter(row=>row.reviewedCoverage===100).length;
fs.writeFileSync('LOCALIZATION_STATUS.md',`# Localization status\n\n**Incomplete: missing translations remain. Commit and push are deferred until completion.**\n\nThe user requested retrying translation access on 29 October 2026 after the initial provider returned HTTP 429. Completed batches are saved in local offline dictionaries. No runtime translation requests are made by the app.\n\n## Inventory\n\n- ${report.routePatterns} actual registered route patterns, ${report.sourceModules} source modules, and ${report.sourceKeyCount} distinct source keys across ${Object.keys(dictionaries['en-IN']).length} namespaces.\n- All 41 configured locales are included; original en-IN returns exact source text.\n- Extraction now includes long educational descriptions, dynamic template messages, and standalone HTML/SVG lab scripts in public/ai-algorithms.\n- ${report.phase2Candidates.length} technical/code/formula candidates remain excluded for classification; the inventory is not a certification that every rendered string is covered.\n\n## Dictionary coverage\n\n| Locale | Present keys | Dictionary coverage | Reviewed coverage | Status |\n|---|---:|---:|---:|---|\n${table}\n\nTarget dictionaries combine authored seeds and build-time machine translations. None has native-speaker sign-off. Unchanged scientific terms are counted as present, and are listed separately in coverage.json. Present keys do not certify translation quality.\n\n## Implemented safeguards\n\n- Lazy namespace dictionaries, manual locale persistence, keyboard-accessible selector, RTL for Arabic and Urdu, and local script-aware font fallbacks.\n- React display-only translation preserves values, handlers, dataset identifiers, routes, model state, source English, and protected mathematical/code regions.\n- Dynamic messages substitute original model values into translated templates; more specific templates take priority.\n- Recharts display labels and ECharts labels preserve series identities, numerical arrays, and chart view state.\n- Same-origin standalone iframe labs translate display text in place without replacing the document or restarting the simulation. Cross-origin frames keep their security boundary.\n\n## Remaining work\n\n1. Finish missing translations for every target locale using a supported provider. The strict audit intentionally fails while any key is missing.\n2. Review machine translations in scientific context. Authored wording takes priority over generated text.\n3. Inspect custom canvas/WebGL drawing text, custom HTML tooltip formatters, mixed technical tables, and excluded formula/prose candidates. These are not certified complete by dictionary percentages.\n4. Complete the final language, route, model-state, responsive and production-build checks, then commit and push main.\n\n## Reproduce\n\n- npm run audit:localization regenerates the inventory and structural report.\n- node scripts/audit-localization.mjs --strict enforces dictionary completeness.\n- node scripts/translate-locales.mjs --cache-only materializes completed batches without any network access.\n- TRANSLATION_PROVIDER=google-cloud uses GOOGLE_TRANSLATE_API_KEY; azure uses AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION. Keep credentials local, never in the repo.\n- Translation-provider protocol references: [Google Cloud](https://docs.cloud.google.com/translate/docs/translate-text), [Azure](https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate).\n\nStructural errors: ${errors.length}. Exact per-locale, per-namespace and per-route figures are in [coverage.json](reports/localization/coverage.json); verification evidence is in [verification.md](reports/localization/verification.md).\n`);
console.log(`${configured.length} locales, ${keys.length} source keys, ${inventory.routes.length} route patterns; ${errors.length} structural errors.`);
if(errors.length) { console.error(errors.slice(0,20).join('\n')); process.exitCode=1; }
if(process.argv.includes('--strict') && Object.values(report.locales).some(row=>row.missingKeys.length)){
 console.error('Incomplete localization: missing translations remain. English fallback is not completion.');process.exitCode=1;
}
