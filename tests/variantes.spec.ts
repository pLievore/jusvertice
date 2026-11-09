import { expect, test } from "@playwright/test";

// Os textos ficam aqui (e não importados de src/content/variantes.ts) porque aquele módulo importa imagens.
const VERSOES = [
  { rota: "/v2", h1: "Antes de vender, confira a matrícula.", canonical: /^https?:\/\/[^/]+\/?$/, rural: false },
  { rota: "/v3", h1: "O seu imóvel é seu no papel?", canonical: /^https?:\/\/[^/]+\/?$/, rural: false },
  { rota: "/georreferenciamento/v2", h1: "A terra é sua. A matrícula confirma?", canonical: /\/georreferenciamento$/, rural: true },
  { rota: "/georreferenciamento/v3", h1: "Deixe a terra pronta para a próxima geração.", canonical: /\/georreferenciamento$/, rural: true },
];

test.describe.configure({ timeout: 120_000 });

for (const v of VERSOES) {
  test(`versão ${v.rota}: hero próprio, fora do índice e origens da página certa`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(v.rota);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(v.h1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", v.canonical);

    const origens = await page.locator("a[data-origem]").evaluateAll((as) => as.map((a) => a.getAttribute("data-origem") ?? ""));
    expect(origens.length).toBeGreaterThanOrEqual(10);
    for (const o of origens) expect(o.startsWith("georref-"), `origem ${o}`).toBe(v.rural);

    const estourados = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("h1, h2, h3")]
        .filter((h) => h.offsetParent !== null && h.clientWidth > 1 && !h.closest(".sr-only"))
        .filter((h) => h.scrollWidth > h.clientWidth + 1)
        .map((h) => h.textContent?.trim().slice(0, 40)),
    );
    expect(estourados).toEqual([]);
  });
}

test("páginas originais continuam indexáveis", async ({ page }) => {
  for (const rota of ["/", "/georreferenciamento"]) {
    await page.goto(rota);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  }
});
