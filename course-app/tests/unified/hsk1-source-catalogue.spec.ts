import {test,expect} from '@playwright/test';
import {sourceCatalogueCases} from '../../../hsk1-app/tests/browser/source-catalogue-cases.ts';
sourceCatalogueCases(lesson=>`/#view=lesson&level=1&lesson=${lesson}&section=practice`,'unified',Array.from({length:15},(_,i)=>i+1),test,expect);
