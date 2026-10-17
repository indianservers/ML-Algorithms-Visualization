import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'targeted-ai-labs.spec.ts',timeout:90000,workers:2,
 outputDir:process.env.AI_LAB_EVIDENCE ? `${process.env.AI_LAB_EVIDENCE}/test-results` : './test-results/targeted-ai-labs',
 reporter:[['list']],use:{baseURL:'http://127.0.0.1:5173',headless:true,viewport:{width:1672,height:941},reducedMotion:'reduce'},
 webServer:{command:'npm run dev -- --host 127.0.0.1',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:30000},
});
