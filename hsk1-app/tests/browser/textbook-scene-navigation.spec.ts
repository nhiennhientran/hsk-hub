import { test, expect } from '@playwright/test';
import { sceneNavigationRegression } from './textbook-scene-regression.ts';
sceneNavigationRegression(test, expect, (lesson, section, scene) => `/#/textbook?lesson=${lesson}&section=${section}${scene ? `&scene=${scene}` : ''}`);
