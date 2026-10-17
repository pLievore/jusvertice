import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { scrollThrough } from "./helpers";

test.describe.configure({ timeout: 120_000 });

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const motion of ["no-preference", "reduce"] as const) {
  test(`axe: nenhuma violação WCAG 2.2 AA (movimento: ${motion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/");
    await scrollThrough(page);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const resumo = violations
      .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join("\n  ")}`)
      .join("\n");
    expect(resumo, "violações do axe").toBe("");
  });
}

test("checklist marcado também passa no axe", async ({ page }) => {
  await page.goto("/");
  const opcoes = page.locator("#checklist label.check-row");
  for (let i = 0; i < 4; i++) await opcoes.nth(i).click();
  await scrollThrough(page);
  const { violations } = await new AxeBuilder({ page }).include("#checklist").withTags(TAGS).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("estrutura: idioma, um h1, títulos sem pular nível, imagens com alt", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("h1")).toHaveCount(1);

  const niveis = await page.locator("h1, h2, h3, h4").evaluateAll((els) =>
    els.filter((e) => !e.closest("[aria-hidden='true']")).map((e) => Number(e.tagName[1])),
  );
  for (let i = 1; i < niveis.length; i++) {
    expect(niveis[i] - niveis[i - 1], `salto de h${niveis[i - 1]} para h${niveis[i]}`).toBeLessThanOrEqual(1);
  }

  const semAlt = await page.locator("img:not([alt])").count();
  expect(semAlt).toBe(0);

  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
});

test("link para pular conteúdo é o primeiro foco e fica visível", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "teclado físico: só no desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(40);
  await page.keyboard.press("Enter");
  await expect(page.locator("#conteudo")).toBeFocused();
});

test("movimento reduzido: animações e transições ficam instantâneas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duracoes = await page.locator(".entrar, .entrar-titulo").evaluateAll((els) => els.map((e) => getComputedStyle(e).animationDuration));
  for (const d of duracoes) expect(parseFloat(d)).toBeLessThan(0.01);
  // Conteúdo revelável nunca fica escondido
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  const ocultos = await page.locator("[data-reveal]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
  expect(ocultos).toBe(0);
});

test("sem JavaScript o conteúdo continua visível e os botões funcionam", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const ocultos = await page.locator("[data-reveal]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
  expect(ocultos).toBe(0);
  const href = await page.locator('a[data-origem="topo"]').getAttribute("href");
  expect(href).toContain("https://wa.me/");
  await ctx.close();
});
