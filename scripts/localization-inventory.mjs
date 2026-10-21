import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = process.cwd(), src = path.join(root, 'src');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const rel = file => path.relative(root,file).replaceAll('\\','/');
const files = walk(src).filter(file => /\.tsx?$/.test(file) && !file.includes(`${path.sep}i18n${path.sep}`));
const hash = source => { let h=2166136261; for(let i=0;i<source.length;i++) h=Math.imul(h^source.charCodeAt(i),16777619); return `s_${(h>>>0).toString(16).padStart(8,'0')}`; };
const interfaceText = value => value.length>1 && value.length<=180 && /[A-Za-z]{2}/.test(value) && !/^(https?:|www\.|\/|#[\w-]|[\w]+_[\w_]+$)/.test(value) && !/[=∑∂∇]|=>|\b(?:const|function|return|import)\s|\{\{|[<>]/.test(value);
const decode = value => value.replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':'\u00a0'}[s])).replace(/&#(x[\da-f]+|\d+);/gi,(_,s)=>String.fromCodePoint(s[0].toLowerCase()==='x'?parseInt(s.slice(1),16):Number(s)));
const normal = value => decode(value.split(/\r?\n/).map((line,i,a)=>i===0?line.trimEnd():i===a.length-1?line.trimStart():line.trim()).filter(Boolean).join(' ')).trim();
function namespace(file) {
  const s=rel(file);
  if(/(?:lesson|learning|quiz|theory)/i.test(s)) return 'lessons';
  if(/(?:dataset|preprocessing)/i.test(s)) return 'datasets';
  if(/(?:chart|visualization)/i.test(s) && !s.includes('/pages/algorithms/')) return 'visualizations';
  if(/(?:Home|Category|Studio|catalog|studios)/.test(s) && !s.includes('/algorithms/') && !s.includes('/features/time-series-studio/')) return 'catalogue';
  if(/navigation|breadcrumb/i.test(s)) return 'navigation';
  if(s.includes('/components/')) return /training|ml\//i.test(s)?'training':'common';
  const domain=s.match(/\/pages\/algorithms\/([^/]+)/)?.[1] ?? s.match(/\/features\/([^/]+)/)?.[1];
  return domain ? `module-${domain}` : 'common';
}
const records = new Map(), english = {}, allKeys = new Map();
function add(ns,value,file,line,kind) {
  if(!value || !/[a-z]{2}/i.test(value)) return;
  const phase=interfaceText(value)?'phase1':'phase2-or-technical-review';
  const key=hash(value);
  if(allKeys.has(key) && allKeys.get(key)!==value) throw Error(`Hash collision: ${value}`);
  allKeys.set(key,value);
  records.get(file).strings.push({key,source:value,line,kind,phase});
  if(phase==='phase1') (english[ns]??={})[key]=value;
}
for(const file of files) {
  const source=fs.readFileSync(file,'utf8'), ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const ns=namespace(file), record={file:rel(file),namespace:ns,imports:[],strings:[],renderable:file.endsWith('.tsx')}; records.set(file,record);
  const visit=node=>{
    if(ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) record.imports.push(node.moduleSpecifier.text);
    if(ts.isCallExpression(node) && node.expression.kind===ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) record.imports.push(node.arguments[0].text);
    if(ts.isJsxText(node)) {
      const parentTag=node.parent?.openingElement?.tagName?.getText(ast)??'';
      add(ns,normal(node.getText(ast)),file,ast.getLineAndCharacterOfPosition(node.pos).line+1,/^(pre|code|kbd|math)$/.test(parentTag)?'protected-technical':'jsx-text');
    }
    if(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const p=node.parent;
      let kind='';
      if(ts.isJsxAttribute(p) && /^(title|placeholder|aria-label|alt|label|description)$/.test(p.name.getText(ast))) kind='presentation-attribute';
      else if(ts.isPropertyAssignment(p) && /^(title|label|description|summary|blurb|subtitle|heading|name|message|tooltip|caption|action)$/.test(p.name.getText(ast).replaceAll(/["']/g,''))) kind='presentation-data';
      else if(ts.isJsxExpression(p)) kind='jsx-expression';
      else if(ts.isCallExpression(p) && /^(setStatus|setError|setMessage|setToast|alert|confirm)$/.test(p.expression.getText(ast))) kind='message';
      if(kind) add(ns,node.text.trim(),file,ast.getLineAndCharacterOfPosition(node.pos).line+1,kind);
    }
    ts.forEachChild(node,visit);
  }; visit(ast);
}
const resolve=(file,spec)=> {
  if(!spec.startsWith('.')) return null;
  const base=path.resolve(path.dirname(file),spec);
  return [base,`${base}.tsx`,`${base}.ts`,path.join(base,'index.tsx'),path.join(base,'index.ts')].find(f=>records.has(f));
};
function closure(file,seen=new Set()) {
  if(!file || seen.has(file)) return seen;
  seen.add(file); for(const spec of records.get(file)?.imports??[]) closure(resolve(file,spec),seen); return seen;
}
const routerFile=path.join(src,'routes/router.tsx'), router=fs.readFileSync(routerFile,'utf8');
const componentImports = new Map([...router.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g)].map(m=>[m[1],resolve(routerFile,m[2])]));
const routeAst=ts.createSourceFile(routerFile,router,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), routes=[];
function routeVisit(node) {
  if(ts.isObjectLiteralExpression(node)) {
    const props=new Map(node.properties.filter(ts.isPropertyAssignment).map(p=>[p.name.getText(routeAst),p.initializer]));
    const route=props.get('path'), index=props.get('index'), element=props.get('element');
    if(element && !props.has('children') && (route && ts.isStringLiteral(route) || index?.kind===ts.SyntaxKind.TrueKeyword)) {
      const component=element.tagName?.getText(routeAst)??element.openingElement?.tagName?.getText(routeAst);
      const file=componentImports.get(component), dependencies=[...closure(file)];
      const strings=dependencies.flatMap(f=>records.get(f).strings);
      routes.push({path:index?'/':`/${route.text.replace(/^\//,'')}`,component,file:file?rel(file):null,namespaces:[...new Set(dependencies.map(f=>records.get(f).namespace))],sourceKeys:[...new Set(strings.filter(s=>s.phase==='phase1').map(s=>s.key))],phase2Candidates:strings.filter(s=>s.phase!=='phase1').length});
    }
  } ts.forEachChild(node,routeVisit);
} routeVisit(routeAst);
const common=JSON.parse(fs.readFileSync(path.join(root,'src/i18n/seed-translations.json'),'utf8'));
for(const source of Object.keys(common['en-IN'])) (english.common??={})[hash(source)]=source;
const localeRoot=path.join(root,'src/i18n/locales'); fs.mkdirSync(localeRoot,{recursive:true});
for(const [ns,dictionary] of Object.entries(english)) {
  fs.mkdirSync(path.join(localeRoot,'en-IN'),{recursive:true});
  fs.writeFileSync(path.join(localeRoot,'en-IN',`${ns}.json`),JSON.stringify(Object.fromEntries(Object.entries(dictionary).sort()),null,2)+'\n');
}
for(const [locale,translations] of Object.entries(common)) {
  if(locale==='en-IN') continue;
  const dictionary={}; for(const [source,value] of Object.entries(translations)) dictionary[hash(source)]=value;
  fs.mkdirSync(path.join(localeRoot,locale),{recursive:true});
  fs.writeFileSync(path.join(localeRoot,locale,'common.json'),JSON.stringify(dictionary,null,2)+'\n');
}
const inventory={generatedFrom:'TypeScript AST: all src/**/*.ts(x) and src/routes/router.tsx',routes,modules:[...records.values()]};
fs.mkdirSync(path.join(root,'reports/localization'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/localization/inventory.json'),JSON.stringify(inventory,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/i18n/route-namespaces.json'),JSON.stringify(routes.map(({path,namespaces})=>({path,namespaces})),null,2)+'\n');
console.log(`Audited ${routes.length} registered route patterns, ${records.size} source modules, ${allKeys.size} distinct source strings; ${Object.keys(english).length} namespaces.`);
