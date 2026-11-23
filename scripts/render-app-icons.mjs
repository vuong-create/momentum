// Re-render the existing vector mark at the sizes required by desktop browsers.
// Development-only; generated PNGs are committed and builds need no browser.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile(new URL('../public/app-icons/momentum.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  for (const size of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{width:100%;height:100%;display:block}</style>${svg}`);
    await page.screenshot({ path: new URL(`../public/app-icons/momentum-${size}.png`, import.meta.url).pathname });
    await page.close();
  }
} finally { await browser.close(); }
