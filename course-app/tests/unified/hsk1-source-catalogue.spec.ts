import {test,expect} from '@playwright/test';
import {sourceCatalogueCases} from '../../../hsk1-app/tests/browser/source-catalogue-cases.ts';
sourceCatalogueCases(lesson=>`/#view=lesson&level=1&lesson=${lesson}&section=practice`,'unified',[1,2,3,5,6,7,8,9,10,11,12,13,14,15],test,expect);
