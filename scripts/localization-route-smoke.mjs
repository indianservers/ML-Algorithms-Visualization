import fs from 'node:fs';
import { chromium } from '@playwright/test';
const inventory=JSON.parse(fs.readFileSync('reports/localization/inventory.json','utf8'));
const ai=[...fs.readFileSync('src/features/ai-virtual-labs/catalog.ts','utf8').matchAll(/slug:\s*'([^']+)'/g)].map(match=>`/ai-algorithms/${match[1]}`);
const studios=[...fs.readFileSync('src/data/studios.ts','utf8').matchAll(/id:\s*'([^']+)'/g)].map(match=>`/studios/${match[1]}`);
const samples=inventory.routes.flatMap(route=>route.path.includes('*')?['/localization-missing-route']:route.path==='/studios/:category'?studios:route.path==='/ai-algorithms/:slug'?ai:route.path.includes('/lessons/')?['/ml/supervised/simple-linear-regression/lessons/3']:route.path.includes(':')?[]:[route.path]);
const retry=process.argv.includes('--retry-failed');
const previous=retry?JSON.parse(fs.readFileSync('reports/localization/routes-browser.json','utf8')).results:[];
const targets=retry?previous.filter(row=>row.status!=='rendered').map(row=>row.route):[...new Set(samples)];
const browser=await chromium.launch({channel:'msedge'}), results=retry?[...previous]:[];
let checked=0;
for(const route of targets) {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.addInitScript(()=>{try{if(window===window.top)localStorage.setItem('mlSuite.locale','hi');}catch{/* sandboxed frames do not share application storage */}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const started=Date.now(); let result;
 try {
  await page.goto(`${process.env.LOCALIZATION_BASE_URL??'http://127.0.0.1:9869'}${route}`);
  await page.locator('main :is(h1,h2,h3,[role=heading])').filter({visible:true}).first().waitFor({state:'visible',timeout:45000});
  await page.locator('html[lang=hi]').waitFor({state:'attached',timeout:10000});
  const title=await page.locator('main :is(h1,h2,h3,[role=heading])').filter({visible:true}).first().innerText();
  result={route,title,errors:[...errors],milliseconds:Date.now()-started,status:errors.length?'pageerror':'rendered'};
 } catch(error) { result={route,errors:[...errors,String(error.message).split('\n')[0]],milliseconds:Date.now()-started,status:'failed'}; }
 await page.close(); checked++;
 if(retry) { const index=results.findIndex(row=>row.route===route); results[index]={...result,initialAttempt:previous[index]}; } else results.push(result);
 if(checked%20===0 || retry) console.log(`${checked}/${targets.length} route samples checked`);
 fs.writeFileSync('reports/localization/routes-browser.json',JSON.stringify({locale:'hi',viewport:1440,routePatterns:inventory.routes.length,results},null,2)+'\n');
}
await browser.close();
fs.writeFileSync('reports/localization/routes-browser.json',JSON.stringify({locale:'hi',viewport:1440,routePatterns:inventory.routes.length,results},null,2)+'\n');
console.log(`${results.filter(row=>row.status==='rendered').length}/${results.length} route samples rendered without pageerror. See reports/localization/routes-browser.json for every result.`);
if(results.some(row=>row.status!=='rendered')) process.exitCode=1;
