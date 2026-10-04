import {test,expect} from '@playwright/test';
import {sourceCatalogueCases} from './source-catalogue-cases.ts';
// Each catalogue lesson is exercised in this host; the existing L4 acceptance stays intact.
sourceCatalogueCases(lesson=>`/#/textbook?lesson=${lesson}&section=practice`,'modular',Array.from({length:15},(_,i)=>i+1),test,expect);
