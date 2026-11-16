// Board checks. Run with: NODE_PATH=$(npm root -g) node tools/verify-board.mjs
// Playwright is resolved locally if installed, otherwise from the global npm root.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const shots = '/tmp/board-shots';
fs.mkdirSync(shots, { recursive: true });

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  const mod = await import(pathToFileURL(path.join(globalRoot, 'playwright', 'index.js')).href);
  chromium = mod.chromium || mod.default?.chromium;
}

function findChromium() {
  const homes = [path.join(process.env.HOME, 'Library/Caches/ms-playwright'), path.join(process.env.HOME, '.cache/ms-playwright')];
  const names = new Set(['chrome-headless-shell', 'chrome', 'Google Chrome for Testing']);
  const hits = [];
  for (const home of homes) {
    if (!fs.existsSync(home)) continue;
    for (const dir of fs.readdirSync(home)) {
      if (!/^chromium/.test(dir)) continue;
      const stack = [[path.join(home, dir), 0]];
      while (stack.length) {
        const [current, depth] = stack.pop();
        if (depth > 7) continue;
        let entries = [];
        try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { continue; }
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) stack.push([full, depth + 1]);
          else if (names.has(entry.name)) {
            try { fs.accessSync(full, fs.constants.X_OK); hits.push(full); } catch { /* not executable */ }
          }
        }
      }
    }
  }
  return hits[0];
}

const browser = await (async () => {
  try {
    return await chromium.launch();
  } catch {
    const executablePath = findChromium();
    if (!executablePath) throw new Error('No Chromium found for Playwright');
    return await chromium.launch({ executablePath });
  }
})();

let failures = 0;
function check(ok, label, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
}

const context = await browser.newContext();
const page = await context.newPage();
const external = [];
page.on('request', (request) => {
  const target = request.url();
  if (!target.startsWith('file://') && !target.startsWith('data:')) external.push(target);
});
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(String(error)));

const sizes = [
  { width: 1440, height: 900, name: 'desktop' },
  { width: 1024, height: 768, name: 'mid' },
  { width: 390, height: 844, name: 'mobile' }
];

for (const size of sizes) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto(url);
  await page.waitForSelector('#bounties .row');

  const initial = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    rows: document.querySelectorAll('#bounties .row').length,
    h1: document.querySelectorAll('h1').length,
    lang: document.documentElement.lang,
    skip: Boolean(document.querySelector('a.skip[href="#bounties"]'))
  }));

  check(initial.scrollWidth <= initial.innerWidth, `${size.width}x${size.height} no horizontal overflow`,
    `scrollWidth ${initial.scrollWidth}, innerWidth ${initial.innerWidth}`);
  check(initial.rows === 11, `${size.width}x${size.height} shows 11 bounty rows`, `${initial.rows} rows`);
  check(initial.h1 === 1 && initial.lang === 'en' && initial.skip, `${size.width}x${size.height} page basics`,
    `lang=${initial.lang}, h1=${initial.h1}, skip=${initial.skip}`);

  if (size.name !== 'mobile') {
    const meta = await page.evaluate(() => {
      const spans = document.querySelectorAll('.row .row-meta');
      const wrapped = Array.from(spans).filter((el) => el.getBoundingClientRect().height > 30).length;
      const target = document.querySelector('.row-meta > span:nth-child(2)');
      const before = getComputedStyle(target, '::before');
      return { wrapped, content: before.content, color: before.color, margin: before.marginRight };
    });
    check(meta.wrapped === 0, `${size.width}x${size.height} row meta stays on one line`, `${meta.wrapped} wrapped`);
    check(meta.content === '"·"' && meta.margin === '8px', `${size.width}x${size.height} row meta separators render`,
      JSON.stringify(meta));
  }

  if (size.name === 'mobile') {
    await page.screenshot({ path: path.join(shots, 'mobile.png'), fullPage: true });
  }

  const before = (await page.textContent('#detail-title')).trim();
  await page.locator('#bounties .row').nth(2).click();
  await page.waitForTimeout(120);
  const after = (await page.textContent('#detail-title')).trim();
  check(after !== before && after.length > 0, `${size.width}x${size.height} third row changes detail`,
    `${before} -> ${after}`);
  const current = await page.locator('#bounties .row[aria-current="true"]').getAttribute('data-slug');
  check(current === 'threejs-fps-02', `${size.width}x${size.height} selected row carries aria-current`, current);

  if (size.name === 'desktop') {
    await page.screenshot({ path: path.join(shots, 'desktop.png'), fullPage: true });
  }

  if (size.name === 'mobile') {
    const open = await page.evaluate(() => document.getElementById('detail').getAttribute('data-open') === 'true');
    check(open, 'mobile row opens the detail sheet');

    const smallTargets = await page.evaluate(() => {
      const selectors = ['.row', '.chip', '.cta', '.search input', '.sort select', '.tabs [role="tab"]', '.btn', '.close'];
      return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => ({ tag: el.className || el.tagName, height: Math.round(el.getBoundingClientRect().height) }))
        .filter((item) => item.height < 44);
    });
    check(smallTargets.length === 0, 'mobile targets are at least 44px tall', JSON.stringify(smallTargets));
  }

  await page.getByRole('tab', { name: 'Leaderboard' }).click();
  const ranked = await page.locator('#panel-leaderboard tbody tr').count();
  const focused = await page.evaluate(() => document.activeElement?.id);
  check(ranked > 0, `${size.width}x${size.height} leaderboard tab shows ranked rows`, `${ranked} rows`);
  check(focused === 'panel-leaderboard', `${size.width}x${size.height} tab activation moves focus to panel`, `focus=${focused}`);

  await page.locator('#tab-overview').focus();
  await page.keyboard.press('ArrowRight');
  const arrowState = await page.evaluate(() => ({
    selected: document.getElementById('tab-leaderboard').getAttribute('aria-selected'),
    focus: document.activeElement?.id
  }));
  check(arrowState.selected === 'true' && arrowState.focus === 'tab-leaderboard',
    `${size.width}x${size.height} arrow keys move between tabs`, JSON.stringify(arrowState));

  const later = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  check(later.scrollWidth <= later.innerWidth, `${size.width}x${size.height} no horizontal overflow after interaction`,
    `scrollWidth ${later.scrollWidth}, innerWidth ${later.innerWidth}`);

  if (size.name === 'mobile') {
    await page.screenshot({ path: path.join(shots, 'mobile-detail.png') });

    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => ({
      open: document.getElementById('detail').getAttribute('data-open'),
      title: document.getElementById('detail-title')?.textContent,
      focus: document.activeElement?.dataset?.slug || ''
    }));
    check(closed.open === null, 'mobile sheet closes with Escape');
    check(closed.focus === 'threejs-fps-02', 'mobile close returns focus to the row', `focus=${closed.focus}`);

    await page.locator('#bounties .row').nth(2).click();
    await page.locator('#close').click();
    const afterClose = await page.evaluate(() => ({
      open: document.getElementById('detail').getAttribute('data-open'),
      focus: document.activeElement?.dataset?.slug || ''
    }));
    check(afterClose.open === null, 'mobile Close button closes the sheet');
    check(afterClose.focus === 'threejs-fps-02', 'mobile Close returns focus to the row', `focus=${afterClose.focus}`);
  }
}

const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const noJsPage = await noJs.newPage();
await noJsPage.goto(url);
const staticState = await noJsPage.evaluate(() => ({
  rows: document.querySelectorAll('#bounties .row').length,
  title: document.querySelector('#detail-title')?.textContent || '',
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  controlsVisible: getComputedStyle(document.querySelector('.controls')).display !== 'none',
  more: document.querySelector('#panel-overview .more')?.textContent || '',
  kind: Boolean(document.querySelector('#panel-overview .kind')) ||
    (document.querySelector('#panel-overview')?.textContent || '').includes('kind:')
}));
check(staticState.rows === 11, 'no-JS list is static markup', `${staticState.rows} rows`);
check(staticState.title === 'Bring the humans', 'no-JS detail is static markup', staticState.title);
check(staticState.more === '…and 97 more places from $6 to $10', 'no-JS reward tail is static markup', staticState.more);
check(!staticState.kind, 'no-JS detail has no enum chip');
check(staticState.scrollWidth <= staticState.innerWidth, 'no-JS mobile no horizontal overflow',
  `scrollWidth ${staticState.scrollWidth}, innerWidth ${staticState.innerWidth}`);
check(!staticState.controlsVisible, 'no-JS hides inert filters');
await noJs.close();

const noJsDesk = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
const noJsDeskPage = await noJsDesk.newPage();
await noJsDeskPage.goto(url);
const paneScroll = await noJsDeskPage.evaluate(() => {
  const pane = document.querySelector('.detail-pane');
  const before = pane.scrollTop;
  pane.scrollTop = 400;
  return {
    clientHeight: pane.clientHeight,
    scrollHeight: pane.scrollHeight,
    scrolled: pane.scrollTop > before,
    noOverflow: document.documentElement.scrollWidth <= window.innerWidth
  };
});
check(paneScroll.scrollHeight > paneScroll.clientHeight && paneScroll.scrolled,
  'no-JS desktop detail pane scrolls independently',
  JSON.stringify(paneScroll));
check(paneScroll.noOverflow, 'no-JS desktop no horizontal overflow');
await noJsDesk.close();

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(url);
await page.waitForSelector('#bounties .row');
check((await page.locator('.row[aria-current="true"]').count()) === 1, 'one row is selected on load');
check((await page.locator('.row').first().getAttribute('data-slug')) === 'bring-the-humans-01', 'default sort is closing soon');

await page.fill('#q', 'chess');
check((await page.locator('.row').count()) === 1, 'search filters rows', `${await page.locator('.row').count()} row`);
await page.fill('#q', 'nothing matches this');
check(await page.locator('#empty').isVisible(), 'empty state is visible', await page.locator('#empty').textContent());
await page.fill('#q', '');

await page.getByRole('button', { name: 'Games', exact: true }).click();
check((await page.locator('.row').count()) === 3, 'category chip filters rows', `${await page.locator('.row').count()} rows`);
await page.getByRole('button', { name: 'All', exact: true }).click();

await page.selectOption('#sort', 'pot');
const biggest = await page.locator('.row').first().textContent();
check(biggest.includes('$1,325'), 'biggest pot sorts first', biggest.match(/\$[\d,]+/)?.[0]);
await page.selectOption('#sort', 'entries');
const most = await page.locator('.row').first().textContent();
check(most.includes('11,444 entries'), 'most entries sorts first', most.match(/[\d,]+ entries/)?.[0]);

const detailCopy = await page.evaluate(() => ({
  places: document.querySelectorAll('#panel-overview .places li').length,
  more: document.querySelector('#panel-overview .more')?.textContent || '',
  after: document.body.textContent.includes('Results posted after close'),
  metric: document.querySelector('#panel-overview .metric')?.textContent || ''
}));
check(detailCopy.places === 3, 'rewards show three explicit places', `${detailCopy.places}`);
check(detailCopy.more === '…and 7 more places at $40', 'equal remaining rewards compress with at', detailCopy.more);
check(detailCopy.after, 'key dates state results timing');
check(detailCopy.metric.length > 0, 'judging states the metric', detailCopy.metric);
const enumChip = await page.evaluate(() => ({
  chip: Boolean(document.querySelector('#panel-overview .kind')),
  text: document.querySelector('#panel-overview').textContent.includes('kind:')
}));
check(!enumChip.chip && !enumChip.text, 'no developer enum chip in the detail', JSON.stringify(enumChip));

await page.goto(url);
await page.waitForSelector('#bounties .row');
await page.locator('.row[data-slug="makefun-frontend-01"]').click();
const paidFee = await page.locator('.stats .stat').nth(1).textContent();
check(paidFee.includes('$0.50'), 'paid entry fee formats as $X.XX', paidFee.replace(/\s+/g, ' ').trim());

check(external.length === 0, 'no external requests', external.join(', '));
check(consoleErrors.length === 0, 'no console errors', consoleErrors.join(' | '));

for (const file of ['desktop.png', 'mobile.png']) {
  const full = path.join(shots, file);
  check(fs.existsSync(full) && fs.statSync(full).size > 1000, `screenshot ${file}`, `${fs.statSync(full).size} bytes`);
}

await context.close();
await browser.close();
console.log(failures === 0 ? 'PASS all checks' : `FAIL ${failures} check(s)`);
process.exit(failures === 0 ? 0 : 1);
