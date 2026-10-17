import type { Page } from "@playwright/test";

/** Percorre a página até o fim para disparar revelações e eventos de rolagem. */
export async function scrollThrough(page: Page, step = 0.6) {
  const { height, vh } = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    vh: window.innerHeight,
  }));
  for (let y = 0; y <= height; y += Math.round(vh * step)) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(1200);
}

/** Evita abrir o WhatsApp de verdade durante os testes. */
export async function blockWhatsApp(page: Page) {
  await page.context().route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>" }),
  );
}

/** O código de atendimento só entra no link depois da hidratação — bom sinal de "JS pronto". */
export async function waitHydrated(page: Page) {
  await page.waitForFunction(() => document.querySelector('a[data-origem="topo"]')?.getAttribute("href")?.includes("JV-"));
}

export async function dataLayerEvents(page: Page) {
  return page.evaluate(() => (window.dataLayer ?? []).map((e) => e as Record<string, unknown>));
}
