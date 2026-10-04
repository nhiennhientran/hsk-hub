import {test,expect} from '@playwright/test';
import {sourcePilotCases} from './source-pilot-cases.ts';
sourcePilotCases('/#/textbook?lesson=4&section=practice','modular',test,expect);
import {sourcePairCases} from './source-pair-cases.ts';
sourcePairCases('/#/textbook?lesson=4&section=practice','/#/progress?lesson=4','modular',test,expect);
