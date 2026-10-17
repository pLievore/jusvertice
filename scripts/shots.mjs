// Capturas de tela para revisão visual.
// Uso: node scripts/shots.mjs [url] [pasta-saida]
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "shots";
await mkdir(out, { recursive: true });

const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${vp.name}-0-topo.png` });

  // Percorre a página para disparar as revelações
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(vp.height * 0.6)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);

  // Telas em pontos-chave
  const marks = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main > section, footer")).map((el) => ({
      id: el.getAttribute("aria-labelledby") ?? el.tagName.toLowerCase(),
      top: el.getBoundingClientRect().top + window.scrollY,
    })),
  );
  let i = 1;
  for (const m of marks) {
    await page.evaluate((yy) => window.scrollTo(0, yy), m.top);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${vp.name}-${i++}-${m.id}.png` });
  }
  await page.close();
}
await browser.close();
console.log("ok", out);
