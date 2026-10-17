import { expect, test } from "@playwright/test";
import { waitHydrated } from "./helpers";

test("comparador antes/depois funciona por teclado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); // sem a dica de movimento automática
  await page.goto("/");
  await waitHydrated(page);
  const slider = page.getByRole("slider", { name: /Comparar o projeto/ });
  await slider.scrollIntoViewIfNeeded();
  await expect(slider).toHaveAttribute("aria-valuenow", "55");
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "45");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
});

test("comparador antes/depois funciona arrastando", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitHydrated(page);
  const slider = page.getByRole("slider", { name: /Comparar o projeto/ });
  await slider.scrollIntoViewIfNeeded();
  const caixa = (await page.locator("section[aria-labelledby='antes-depois-titulo'] .touch-pan-y").boundingBox())!;
  await page.mouse.move(caixa.x + caixa.width * 0.5, caixa.y + caixa.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(caixa.x + caixa.width * 0.2, caixa.y + caixa.height * 0.5, { steps: 6 });
  await page.mouse.up();
  const valor = Number(await slider.getAttribute("aria-valuenow"));
  expect(valor).toBeGreaterThan(15);
  expect(valor).toBeLessThan(25);
});

test("situações fixadas (desktop): focar o link de um slide leva a rolagem até ele", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "no celular as situações são uma pilha simples");
  await page.goto("/");
  await waitHydrated(page);
  const links = page.locator("section[aria-labelledby='situacoes-titulo'] a[data-origem]");
  await expect(links).toHaveCount(4);
  await links.nth(2).focus();
  await page.waitForTimeout(1200);
  const visivel = await links.nth(2).evaluate((el) => {
    const r = el.getBoundingClientRect();
    let opacidade = 1;
    for (let n: HTMLElement | null = el as HTMLElement; n; n = n.parentElement) opacidade *= Number(getComputedStyle(n).opacity);
    return r.top >= 0 && r.bottom <= window.innerHeight && opacidade > 0.8;
  });
  expect(visivel).toBe(true);
});

test("header nasce no palco e vira papel depois do hero", async ({ page }) => {
  await page.goto("/");
  await waitHydrated(page);
  const fundo = () => page.locator("header").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fundo()).toMatch(/rgba\(7, 20, 41, 0\)|rgba\(0, 0, 0, 0\)/);
  await page.locator("#checklist").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  expect(await fundo()).toMatch(/rgba\(247, 245, 240/);
});

test("comparador: os 4 apontamentos existem em texto (legenda) e na imagem", async ({ page }) => {
  await page.goto("/");
  const secao = page.locator("section[aria-labelledby='antes-depois-titulo']");
  await expect(secao.locator("ol > li")).toHaveCount(4);
  await expect(secao.locator(".marcador")).toHaveCount(4);
});
