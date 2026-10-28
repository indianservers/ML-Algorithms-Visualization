/** Build-time translation only. Public interface text is sent to Google Translate;
 * shipped applications load local JSON and never contact a translation service.
 * Resumable cache, bounded retries and strict entry/placeholder checks prevent
 * failed requests from being counted as completed translations. */
import fs from 'node:fs';
import path from 'node:path';
const root = 'src/i18n/locales';
const english = Object.fromEntries(fs.readdirSync(`${root}/en-IN`).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),JSON.parse(fs.readFileSync(`${root}/en-IN/${f}`,'utf8'))]));
const source = Object.assign({}, ...Object.values(english));
const locales = fs.readdirSync(root).filter(l=>l!=='en-IN');
const selected = process.env.TRANSLATE_LOCALES?.split(',') ?? locales;
const cacheRoot = '.localization-translation.local';
fs.mkdirSync(cacheRoot,{recursive:true});
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
const provider=process.env.TRANSLATION_PROVIDER??'google-cloud';
const cacheOnly=process.argv.includes('--cache-only');
if(!cacheOnly && !['google-cloud','azure'].includes(provider))throw Error('Use TRANSLATION_PROVIDER=google-cloud or azure.');
if(!cacheOnly && provider==='google-cloud' && !process.env.GOOGLE_TRANSLATE_API_KEY)throw Error('Configure GOOGLE_TRANSLATE_API_KEY locally, or use --cache-only to materialize completed translations.');
if(!cacheOnly && provider==='azure' && !process.env.AZURE_TRANSLATOR_KEY)throw Error('Configure AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION locally.');
const provenance = { provider:cacheOnly?'saved preliminary Google Translate batches and authored overrides':provider, configuredProvider:provider, mode:'build-time machine translation with existing authored overrides', nativeSpeakerReviewed:false, sourceLanguage:'en', generatedAt:new Date().toISOString(), locales:{} };
const queue=[];
const states=new Map();
for(const locale of selected){
  const file=path.join(cacheRoot,`${locale}.json`);
  const saved=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const authored=JSON.parse(fs.readFileSync(`${root}/${locale}/common.json`,'utf8'));
  const entries={...saved,...authored};
  states.set(locale,{file,entries,completed:0});
  let batch=[],size=0;
  for(const [key,text] of Object.entries(source)){
    if(entries[key]) continue;
    if(size+text.length+25>3800 && batch.length){queue.push({locale,batch});batch=[];size=0;}
    batch.push({key,text});size+=text.length+25;
  }
  if(batch.length)queue.push({locale,batch});
}
// Round-robin languages avoids sending one locale's entire corpus consecutively.
queue.sort((a,b)=>a.batch[0].key.localeCompare(b.batch[0].key));
let done=0,failed=0;
let blocked=false;
async function request(locale,batch){
  const protectedValues=[];
  const protect=text=>text.replace(/\{\{[^}]+\}\}|\$\{[^}]+\}|https?:\/\/[^\s]+|\b(?:AIMERS|TensorFlow(?:\.js)?|Python|JavaScript|WebGL|GPU|CPU|ARIMA|LSTM|GRU|RNN|RMSE|MAE|MSE|CSV|JSON|API|HTML|CSS|PCA|DBSCAN|OPTICS)\b/g,value=>{const token=`\ue002${protectedValues.length}\ue003`;protectedValues.push(value);return token;});
  const texts=batch.map(({text})=>protect(text));
  const response=provider==='google-cloud'
    ? await fetch('https://translation.googleapis.com/language/translate/v2',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':process.env.GOOGLE_TRANSLATE_API_KEY},body:JSON.stringify({q:texts,source:'en',target:locale,format:'text'}),signal:AbortSignal.timeout(45000)})
    : await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=${locale}`,{method:'POST',headers:{'Content-Type':'application/json','Ocp-Apim-Subscription-Key':process.env.AZURE_TRANSLATOR_KEY,'Ocp-Apim-Subscription-Region':process.env.AZURE_TRANSLATOR_REGION??''},body:JSON.stringify(texts.map(Text=>({Text}))),signal:AbortSignal.timeout(45000)});
  if(!response.ok){if([401,403,429].includes(response.status))blocked=true;throw Error(`HTTP ${response.status}`);}
  const data=await response.json();
  const translated=provider==='google-cloud'?data.data.translations.map(t=>t.translatedText):data.map(t=>t.translations[0].text);
  const pieces=translated.map((text,i)=>['',String(i),text]);
  if(pieces.length!==batch.length)throw Error(`Boundary mismatch ${pieces.length}/${batch.length}`);
  const result={};
  for(const [,index,value] of pieces){
    const item=batch[Number(index)];
    const output=value.trim().replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[0-9a-f]+|\d+);/gi,entity=>{
      const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
      return named[entity]??String.fromCodePoint(entity[2].toLowerCase()==='x'?parseInt(entity.slice(3,-1),16):Number(entity.slice(2,-1)));
    }).replace(/[০-৯०-९٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(['০','०','٠','۰'].map(x=>x.charCodeAt(0)).find(n=>c.charCodeAt(0)>=n&&c.charCodeAt(0)<n+10)))).replace(/\ue002\s*(\d+)\s*\ue003/g,(_,n)=>protectedValues[Number(n)]);
    const placeholders=s=>[...s.matchAll(/\{\{[^}]+\}\}|\$\{[^}]+\}/g)].map(m=>m[0]).sort().join('|');
    if(!item || !output || /[\ue000-\ue003]/.test(output) || placeholders(output)!==placeholders(item.text))throw Error(`Invalid output for ${item?.key}`);
    result[item.key]=output;
  }
  return result;
}
async function worker(){
  while(queue.length && !blocked){
    const {locale,batch}=queue.shift();
    let result,error;
    for(let attempt=0;attempt<4;attempt++){
      try{result=await request(locale,batch);break;}catch(e){error=e;if(blocked || /Boundary|Invalid output/.test(e.message))break;await pause(1000*2**attempt);}
    }
    if(!result){if(!blocked && batch.length>1){const mid=Math.ceil(batch.length/2);queue.push({locale,batch:batch.slice(0,mid)},{locale,batch:batch.slice(mid)});}else{failed++;console.error(`${locale}: ${error.message}`);}continue;}
    const state=states.get(locale);Object.assign(state.entries,result);state.completed++;
    fs.writeFileSync(state.file,JSON.stringify(state.entries));
    done++;
    if(done%50===0)console.log(`${done} batches complete; ${queue.length} queued; ${failed} failed`);
    await pause(100);
  }
}
console.log(`${selected.length} locales; ${Object.keys(source).length} source keys; ${queue.length} translation batches`);
if(!cacheOnly)await Promise.all(Array.from({length:Number(process.env.TRANSLATE_CONCURRENCY??2)},worker));
for(const [locale,state] of states){
  for(const [namespace,base] of Object.entries(english)){
    const dictionary=Object.fromEntries(Object.keys(base).filter(key=>state.entries[key]).map(key=>[key,state.entries[key]]));
    // Preserve authored common entries whose canonical source is in another namespace.
    if(namespace==='common')Object.assign(dictionary,JSON.parse(fs.readFileSync(`${root}/${locale}/common.json`,'utf8')));
    const destination=`${root}/${locale}/${namespace}.json`;
    if(Object.keys(dictionary).length)fs.writeFileSync(destination,JSON.stringify(dictionary,null,2)+'\n');
    else if(fs.existsSync(destination) && !Object.keys(JSON.parse(fs.readFileSync(destination,'utf8'))).length)fs.unlinkSync(destination);
  }
  provenance.locales[locale]={present:Object.keys(source).filter(k=>state.entries[k]).length,total:Object.keys(source).length};
}
fs.writeFileSync('reports/localization/translation-provenance.json',JSON.stringify(provenance,null,2)+'\n');
console.log(`Finished: ${done} successful batches, ${failed} failed. Rerun to retry missing entries.`);
if(failed || blocked)process.exitCode=1;
