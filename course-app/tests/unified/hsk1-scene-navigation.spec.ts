import { test, expect } from '@playwright/test';
import { sceneNavigationRegression } from '../../../hsk1-app/tests/browser/textbook-scene-regression.ts';
sceneNavigationRegression(test, expect, (lesson, section, scene) => `/#view=lesson&level=1&lesson=${lesson}&section=${section}${scene ? `&scene=${scene}` : ''}`);
