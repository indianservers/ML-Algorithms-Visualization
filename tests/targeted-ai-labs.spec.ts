import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {labSlugs} from '../src/features/ai-virtual-labs/targeted/engines';
const evidence=process.env.AI_LAB_EVIDENCE??'test-results/targeted-ai-labs-evidence';
test.beforeAll(async()=>{await mkdir(evidence,{recursive:true});});
for(const [i,slug] of labSlugs.entries())test(`${String(i+1).padStart(2,'0')} ${slug}: playback, tabs, parameters and responsive screenshots`,async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.route('**/api/session', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:null,authenticated:false})}));
 await page.goto(`/ai-algorithms/${slug}`);await expect(page.locator('.al-root')).toBeVisible();
 await expect(page.locator('.route-progress')).not.toHaveAttribute('data-active',/.*/, {timeout:10000});
 await page.waitForTimeout(300);
 await expect(page.getByTestId('algorithm-status')).toHaveText('Ready');
 const root=page.locator('.al-root');
 await root.getByRole('button',{name:'Step',exact:true}).click();
 await expect(root.locator('.al-timeline')).toContainText('State 2');
 await root.getByRole('button',{name:'Previous',exact:true}).click();
 await expect(root.locator('.al-timeline')).toContainText('State 1');
 await root.getByRole('button',{name:'Reset',exact:true}).click();
 const parameter=root.locator('.al-parameters select').first();
 if(await parameter.count()){const options=await parameter.locator('option').allTextContents();const initialValue=await parameter.inputValue();if(options.length>1){await parameter.selectOption({label:options.find(o=>o!==initialValue)!});await expect(page.getByTestId('algorithm-status')).toHaveText('Ready');await parameter.selectOption(initialValue);}}
 else {const range=root.locator('.al-parameters input[type="range"]').first();if(await range.count()){const original=await range.inputValue();const min=Number(await range.getAttribute('min'));const step=Number(await range.getAttribute('step'));await range.fill(String(min+step));await expect(page.getByTestId('algorithm-status')).toHaveText('Ready');await range.fill(original);}}
 await expect(page.getByTestId('algorithm-status')).toHaveText('Ready');
 // Check real timer-driven play/pause without relying on a synthetic clock.
 await root.getByRole('button',{name:'Run',exact:true}).click();
 await expect(root.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();
 await page.waitForTimeout(600);await root.getByRole('button',{name:'Pause',exact:true}).click();
 const paused=await root.locator('.al-timeline').innerText();await page.waitForTimeout(550);expect(await root.locator('.al-timeline').innerText()).toBe(paused);
 await root.getByRole('button',{name:'Reset',exact:true}).click();
 for(const name of ['Learn','Code','Practice','Experiments']){await root.getByRole('tab',{name,exact:true}).click();await expect(root.getByRole('tabpanel')).toBeVisible();}
 await root.getByRole('button',{name:'Save current state',exact:true}).click();await expect(root.getByText('Experiment 1 · Ready')).toBeVisible();
 await root.getByRole('button',{name:'Load configuration',exact:true}).click();
 await root.getByRole('button',{name:'Copy',exact:true}).click();await expect(root.getByRole('button',{name:'Copied',exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain(slug==='deep-q-network'?'DQN':'');
 const toggle=root.getByRole('checkbox',{name:/Show .*Values|Show Weights/}).first();if(await toggle.isVisible()){await toggle.uncheck();await toggle.check();}
 // Capture meaningful intermediate state, derived from the actual engine.
 for(let step=0;step<(slug==='particle-filtering'?32:slug==='expectimax-search'?18:slug==='iterative-deepening-a-star'?12:3);step++){const button=root.getByRole('button',{name:'Step',exact:true});if(await button.isEnabled())await button.click();}
 if(slug==='deep-q-network'||slug==='monte-carlo-control'){await root.getByRole('spinbutton',{name:'Episodes',exact:true}).fill('3');await root.getByRole('slider',{name:/Execution Speed/}).fill('20');await root.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByTestId('algorithm-status')).toHaveText('SUCCESS',{timeout:45000});}
 for(const [width,height] of [[1672,941],[1920,1080],[1366,768],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);await expect(page.locator('.route-progress')).not.toHaveAttribute('data-active',/.*/, {timeout:10000});await page.locator('#main-content').evaluate(e=>e.scrollTop=0);
  expect(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);
  await page.screenshot({path:join(evidence,`${String(i+1).padStart(2,'0')}-${slug}-${width}.png`),fullPage:false});
  if(width===1672)await root.screenshot({path:join(evidence,`${String(i+1).padStart(2,'0')}-${slug}-content.png`)});
 }
 await page.setViewportSize({width:1672,height:941});
 const episodes=root.getByRole('spinbutton',{name:'Episodes',exact:true});if(await episodes.count())await episodes.fill('1');
 const maxSteps=root.getByRole('spinbutton',{name:'Maximum Steps',exact:true});if(await maxSteps.count())await maxSteps.fill('20');
 await root.getByRole('slider',{name:/Execution Speed/}).fill('20');
 await root.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByTestId('algorithm-status')).not.toHaveText(/^(Ready|Running)$/, {timeout:45000});
 await root.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByTestId('algorithm-status')).toHaveText('Ready');
 await root.getByRole('link',{name:'Back to Labs'}).click();await expect(page).toHaveURL(/\/studios\/ai-virtual-labs$/);
 expect(errors).toEqual([]);
});
