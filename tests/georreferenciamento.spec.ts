import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { origens, type Origem } from "../src/content/origens";
import { scrollThrough } from "./helpers";

const ROTA = "/georreferenciamento";

test.describe.configure({ timeout: 120_000 });

test("georref: axe sem violações WCAG 2.2 AA", async ({ page }) => {
  await page.goto(ROTA);
  await scrollThrough(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const resumo = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`).join("\n");
  expect(resumo, "violações do axe").toBe("");
});

test("georref: título, metadados e um único h1", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page).toHaveTitle(/Regularização de imóvel rural/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Sua terra está em ordem no cartório?");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/georreferenciamento$/);
});

test("georref: todo botão de WhatsApp usa uma origem rural, com mensagem e código", async ({ page }) => {
  await page.goto(ROTA);
  await expect(page.locator("a[data-origem]").first()).toHaveAttribute("href", /JV-/);
  const links = page.locator("a[data-origem]");
  const total = await links.count();
  expect(total).toBeGreaterThanOrEqual(10);
  for (let i = 0; i < total; i++) {
    const origem = (await links.nth(i).getAttribute("data-origem")) as Origem;
    expect(origem, "origem da página principal vazou para a página rural").toMatch(/^georref-/);
    const texto = new URL((await links.nth(i).getAttribute("href"))!).searchParams.get("text") ?? "";
    expect(texto.startsWith(origens[origem])).toBe(true);
    expect(texto).toMatch(/Código: JV-[2-9A-HJ-NP-Z]{4}$/);
  }
});

test("georref: checklist rural vai na mensagem", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROTA);
  await expect(page.locator('a[data-origem="georref-topo"]')).toHaveAttribute("href", /JV-/);
  await page.locator("#checklist label.check-row").first().click();
  const texto = new URL((await page.locator('a[data-origem="georref-checklist"]').getAttribute("href"))!).searchParams.get("text");
  expect(texto).toContain("• Vou vender, dividir ou passar a terra para herdeiros");
});

for (const largura of [320, 390, 1024]) {
  test(`georref: sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto(ROTA);
    await scrollThrough(page, 1);
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
}

for (const rota of ["/", ROTA]) {
  test(`nenhum título visível estoura a coluna em 360px (${rota})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(rota);
    const estourados = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("h1, h2, h3")]
        .filter((h) => h.offsetParent !== null && h.clientWidth > 1 && !h.closest(".sr-only"))
        .filter((h) => h.scrollWidth > h.clientWidth + 1)
        .map((h) => `${h.textContent?.trim().slice(0, 40)} (${h.scrollWidth}>${h.clientWidth})`),
    );
    expect(estourados).toEqual([]);
  });
}

test("georref: imagem de compartilhamento própria", async ({ request }) => {
  const r = await request.get(`${ROTA}/opengraph-image`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("image/png");
});
