import {defineConfig} from '@playwright/test';
import base from './playwright.config.ts';
export default defineConfig(base,{
  metadata:{...base.metadata,finalQATarget:{mode:process.env.HSK_FINAL_QA_URL?'live':'frozen',baseURL:process.env.HSK_FINAL_QA_URL??base.use?.baseURL,webServerConfigured:!process.env.HSK_FINAL_QA_URL,casesPerEngine:127}},
  testMatch:['remaining-coverage.spec.ts','requirements.spec.ts','teaching-clarifications.spec.ts','precision-playback.spec.ts','compatibility-entry.spec.ts']
});
