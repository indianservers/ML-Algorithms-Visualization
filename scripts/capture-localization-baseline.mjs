import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge'});
const result=process.env.LOCALIZATION_REFERENCE_ROUTE ? JSON.parse(fs.readFileSync('tests/fixtures/localization-english-baseline.json','utf8')) : {};
for(const route of ['/', '/ml/optimization/gradient-descent', '/ml/time-series/rnn-forecasting?quick=1', '/ml/lab/dataset-manager', '/ml/supervised/simple-linear-regression/lessons/3']) {
 if(process.env.LOCALIZATION_REFERENCE_ROUTE && route!==process.env.LOCALIZATION_REFERENCE_ROUTE) continue;
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`${process.env.LOCALIZATION_REFERENCE_URL ?? 'http://127.0.0.1:9868'}${route}`);
 await page.locator('main h1').first().waitFor({state:'visible',timeout:60000});
 if(route==='/ml/lab/dataset-manager') await page.locator('#editable-grid tbody input[aria-label]').first().waitFor({state:'visible',timeout:60000});
 await page.locator('[aria-label="Loading algorithm tools"]').waitFor({state:'detached',timeout:120000});
 await page.waitForTimeout(1600);
 result[route]=await page.evaluate(()=> {
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const text=[];
  while(walker.nextNode()) {const node=walker.currentNode; if(node.parentElement?.closest('script,style,.ml-locale,.route-progress'))continue;
   if(!node.parentElement?.checkVisibility())continue;
   const value=node.textContent?.replace(/\s+/g,' ').trim();if(value)text.push(value); }
  return text;
 });
 await page.close();
}
fs.writeFileSync('tests/fixtures/localization-english-baseline.json',JSON.stringify(result,null,2)+'\n');
await browser.close();console.log('Captured complete English source reference using stock React JSX (localization adapter disabled).');
