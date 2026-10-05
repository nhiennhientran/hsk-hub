import type { test as Test, expect as Expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getHomework30Bank } from '../../src/services/content/homework30.ts';
import { homework30Group, submitHomework30 } from '../../src/domain/homework30/engine.ts';
import { createCompatibility } from '../../src/services/storage/compatibility.ts';
import { sceneFigures } from '../../src/services/source-activities/scene-figures.ts';
import { loadActiveHsk1ForTests } from './active-official-vi.ts';
const stateKey = 'ran_hsk1_modular_v1';
const oldKey = 'ran_hsk1_stage2_v3';
const original = readFileSync(new URL('../fixtures/migration/stage2.json', import.meta.url), 'utf8');
const book = JSON.parse(readFileSync(new URL('../../content/textbook.json', import.meta.url), 'utf8'));

const json = (name: string) => JSON.parse(readFileSync(new URL(`../../content/${name}.json`, import.meta.url), 'utf8'));
const seedData = createCompatibility(json('stage2-bank'), json('stage3-catalog'), book).migrate({ [oldKey]: original }, 1790812800000).data;
const homeworkLesson = getHomework30Bank()[0];
homework30Group(seedData.homework30!, 1, 'choice').draft = Object.fromEntries(homeworkLesson.choice.map(q => [q.id, q.answer]));
if (!submitHomework30(seedData.homework30!, homeworkLesson, 'choice', 1790812800000).ok) throw Error('Could not prepare nonempty homework fixture');
const seed = JSON.stringify({ app: 'hsk1-modular', schema: 1, revision: 1, updatedAt: 1790812800000, data: seedData, recovery: null });

async function seedNonempty(page:Page){
  await page.addInitScript(({ oldKey, original, stateKey, seed }) => {
    sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
    if (!localStorage.getItem(stateKey)) localStorage.setItem(stateKey, seed);
    if (!localStorage.getItem(oldKey)) localStorage.setItem(oldKey, original);
  }, { oldKey, original, stateKey, seed });
}
async function assertSceneGallery(page:Page,lesson:number,sceneId:string,expect:typeof Expect){
  const expected=sceneFigures(lesson,sceneId,(await loadActiveHsk1ForTests()).registry);expect(expected.length,sceneId).toBeGreaterThan(0);
  const gallery=page.locator('#scene-content .textbook-scene-figures[data-original-text]');await expect(gallery).toBeVisible();
  expect(await gallery.locator('[data-scene-figure]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-scene-figure')))).toEqual(expected.map(figure=>figure.id));
  for(const figure of expected){
    const node=gallery.locator(`[data-scene-figure="${figure.id}"]`),image=node.locator('img');await expect(image).toHaveAttribute('alt',`${figure.alt.zh} · ${figure.alt.vi}`);
    await expect(node.locator('figcaption')).toHaveText(`教材原图 · 第${figure.source.printedPage}页 · Hình gốc trong sách · Trang ${figure.source.printedPage}`);
    await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);
    const url=await image.getAttribute('src');if(!url)throw Error(`No image URL for ${sceneId}/${figure.id}`);
    expect(new URL(url,page.url()).pathname).toBe(new URL(`./source-activities/${figure.file}`,page.url()).pathname);
    const response=await page.request.get(url);expect(response.ok()).toBe(true);expect(createHash('sha256').update(await response.body()).digest('hex'),`${sceneId}/${figure.id}`).toBe(figure.sha256);
    const box=await image.boundingBox();if(!box)throw Error(`Source scene image is hidden: ${sceneId}/${figure.id}`);expect(box.width).toBeGreaterThan(0);expect(box.height).toBeGreaterThan(0);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
async function assertGalleryHidden(page:Page,lesson:number,sceneId:string,expect:typeof Expect){
  await expect(page.locator('#scene-content .textbook-scene-figures')).toBeHidden();
  await expect(page.locator('[data-original-text]:visible')).toHaveCount(0);
  const accessible=await page.locator('#scene-content').ariaSnapshot();
  for(const figure of sceneFigures(lesson,sceneId,(await loadActiveHsk1ForTests()).registry))for(const text of [figure.alt.zh,figure.alt.vi,`教材原图 · 第${figure.source.printedPage}页`,`Hình gốc trong sách · Trang ${figure.source.printedPage}`])expect(accessible).not.toContain(text);
}

/** Shared native regression: run against both legacy lifecycle and unified bridge. */
export function sceneNavigationRegression(test: typeof Test, expect: typeof Expect, url: (lesson: number, section: string, scene?: number) => string) {
  test('HSK1 selected scene labels remain readable while hovered', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedNonempty(page);
    await page.goto(url(1, 'text', 1));
    await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
    const tabs = page.locator('[data-scene-tab]');
    await expect(tabs).toHaveCount(book.lessons[0].scenes.length);
    for (let index = 0; index < await tabs.count(); index++) {
      const tab = tabs.nth(index);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await tab.hover();
      const contrast = await tab.evaluate(async node => {
        getComputedStyle(node).backgroundColor;
        await Promise.allSettled(node.getAnimations().map(animation => animation.finished));
        const style = getComputedStyle(node);
        const luminance = (color: string) => {
          const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
            const channel = value / 255;
            return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
          });
          return .2126 * rgb[0]! + .7152 * rgb[1]! + .0722 * rgb[2]!;
        };
        const foreground = luminance(style.color), background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
      });
      expect(contrast, `scene ${index + 1} hovered label contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: test.info().outputPath('selected-scene-hover.png'), fullPage: true });
  });
  for (const width of [390, 1280]) for (const mode of ['listen', 'hide'] as const) {
    test(`HSK1 ${mode} retains hidden dialogue across scene history at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await seedNonempty(page);
      await page.goto(url(1, 'text', 1));
      const ready = async () => expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
      const saved = async () => {
        await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state', 'saved');
        return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, stateKey);
      };
      await ready(); const before = await saved();
      expect(Object.keys(before.homework.lessons).length).toBeGreaterThan(0);
      expect(before.homework30.lessons['1'].choice.first).toBeTruthy();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
      await expect(page.locator('#text-show-original')).toBeChecked();
      await assertSceneGallery(page,1,book.lessons[0].scenes[0].id,expect);
      if (mode === 'listen') await page.locator('#text-listen-mode').check();
      else await page.locator('#text-show-original').uncheck();
      expect(await saved()).toEqual(before); // Display choices cause no learning-state writes.
      async function hidden(scene: number) {
        const row = book.lessons[0].scenes[scene - 1];
        await expect(page.locator('#scene-content')).toHaveAttribute('data-scene-id', row.id);
        await expect(page.locator('#text-listen-mode')).toBeChecked({ checked: mode === 'listen' });
        await expect(page.locator('#text-show-original')).not.toBeChecked();
        await expect(page.locator('[data-original-text]:visible')).toHaveCount(0);
        expect(await page.locator('[data-original-text]').evaluateAll(nodes => nodes.every(n => (n as HTMLElement).hidden))).toBe(true);
        const accessible = await page.locator('#scene-content').ariaSnapshot();
        for (const line of row.lines) for (const text of [line.zh, line.py, line.vn]) expect(accessible).not.toContain(text);
        await assertGalleryHidden(page,1,row.id,expect);
        await expect(page.locator('[data-scene-audio]')).toBeEnabled();
        await expect(page.locator('#scene-slow')).toBeEnabled();
        expect((await saved()).navigation.scene).toBe(scene);
      }
      async function currentSection(scene: number) {
        const link=page.locator('[data-textbook-sections] a[data-section="text"]');
        await expect(link).toHaveAttribute('href',new RegExp('(?:[?&])scene='+scene+'(?:&|$)'));
        await link.click();await hidden(scene);
      }
      await hidden(1);
      await page.locator('[data-line-audio]').first().click();
      await expect(page.locator('#audio-player')).toHaveAttribute('data-state', /playing|ended/);
      for (const line of book.lessons[0].scenes[0].lines) expect(await page.locator('#audio-player').ariaSnapshot()).not.toContain(line.zh);
      if (width === 1280) {
        await page.locator('[data-scene-tab]').nth(1).click(); await hidden(2);
        await expect(page.locator('[data-scene-tab]').nth(1)).toBeFocused();await currentSection(2);
        await page.locator('[data-scene-tab]').nth(1).press('ArrowLeft'); await hidden(1);
        await expect(page.locator('[data-scene-tab]').first()).toBeFocused();
        await page.locator('[data-scene-tab]').first().press('End'); await hidden(book.lessons[0].scenes.length);
      } else {
        await page.locator('#scene-select').selectOption('1'); await hidden(2);
        await expect(page.locator('#scene-select')).toBeFocused();await currentSection(2);
        await page.locator('#scene-select').selectOption('0'); await hidden(1);
        await page.locator('#scene-select').selectOption(String(book.lessons[0].scenes.length - 1)); await hidden(book.lessons[0].scenes.length);
      }
      await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'idle');
      await page.goBack(); await hidden(1);
      await expect(width === 390 ? page.locator('#scene-select') : page.locator('[data-scene-tab]').first()).toBeFocused();
      await page.goForward(); await hidden(book.lessons[0].scenes.length);
      await page.screenshot({path:`test-results/hsk1-scene-${mode}-${width}-hidden-${test.info().project.name}.png`,fullPage:true});
      const after = await saved();
      for (const key of Object.keys(before).filter(key => !['navigation', 'reading'].includes(key))) expect(after[key]).toEqual(before[key]);
      expect(after.reading).toEqual(before.reading);
      expect(await page.evaluate(key => localStorage.getItem(key), oldKey)).toBe(original);
      // Full reload restores the route, never ephemeral display choices.
      await page.reload(); await ready();
      await expect(page.locator('#scene-select')).toHaveValue(String(book.lessons[0].scenes.length - 1));
      await expect(page.locator('#text-show-original')).toBeChecked();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
      await assertSceneGallery(page,1,book.lessons[0].scenes.at(-1).id,expect);
      await page.screenshot({path:`test-results/hsk1-scene-${mode}-${width}-reload-${test.info().project.name}.png`,fullPage:true});
      await page.locator('#text-listen-mode').check();
      await page.locator('[data-textbook-sections] a[data-section="grammar"]').click(); await ready();
      await page.locator('[data-textbook-sections] a[data-section="text"]').click(); await ready();
      await expect(page.locator('#text-show-original')).toBeChecked();
      await expect(page.locator('#text-listen-mode')).not.toBeChecked();
    });
  }
  for(const width of [320,1440])test(`HSK1 all textbook scene galleries retain source bindings and hide alt at ${width}px`,async({page})=>{
    test.setTimeout(150_000);await page.setViewportSize({width,height:900});await seedNonempty(page);await page.goto(url(1,'text',1));
    await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state','saved');const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,stateKey);
    expect(before.homework30.lessons['1'].choice.first).toBeTruthy();let scenes=0,figures=0;
    for(const lesson of book.lessons)for(const [index,scene]of lesson.scenes.entries()){
      await page.evaluate(hash=>{location.hash=hash;},new URL(url(lesson.id,'text',index+1),'http://fixture.invalid').hash);
      await expect(page.locator('#scene-content')).toHaveAttribute('data-scene-id',scene.id);await expect(page.locator('#reading-save-status')).toHaveAttribute('data-state','saved');
      await page.locator('#text-show-original').check();await assertSceneGallery(page,lesson.id,scene.id,expect);scenes++;figures+=sceneFigures(lesson.id,scene.id).length;
      await page.locator('#text-show-original').uncheck();await assertGalleryHidden(page,lesson.id,scene.id,expect);await expect(page.locator('[data-scene-audio]')).toBeEnabled();
      await page.locator('#text-show-original').check();
    }
    expect(scenes).toBe(45);expect(figures).toBe(48);
    const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).data,stateKey);
    for(const key of Object.keys(before).filter(key=>!['navigation','reading'].includes(key)))expect(after[key],key).toEqual(before[key]);expect(await page.evaluate(key=>localStorage.getItem(key),oldKey)).toBe(original);
    await page.reload();await expect(page.locator('#scene-content')).toHaveAttribute('data-scene-id',book.lessons.at(-1).scenes.at(-1).id);await expect(page.locator('#text-show-original')).toBeChecked();await assertSceneGallery(page,15,book.lessons.at(-1).scenes.at(-1).id,expect);
  });
}
