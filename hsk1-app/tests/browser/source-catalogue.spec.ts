import {test,expect} from '@playwright/test';
import {sourceCatalogueCases} from './source-catalogue-cases.ts';
// Existing L4 standalone acceptance remains intact.
sourceCatalogueCases(lesson=>`/#/textbook?lesson=${lesson}&section=practice`,'modular',[6,7,9,12],test,expect);
