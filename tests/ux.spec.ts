import { expect, test } from "@playwright/test";
import { origens, type Origem } from "../src/content/origens";
import { blockWhatsApp, dataLayerEvents, scrollThrough, waitHydrated } from "./helpers";

function mensagem(href: string | null) {
  const url = new URL(href ?? "");
  return url.searchParams.get("text") ?? "";
}

test("cada botão de WhatsApp leva a mensagem da sua origem + código de atendimento", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[data-origem="topo"]')).toHaveAttribute("href", /JV-/);
  const links = page.locator("a[data-origem]");
  const total = await links.count();
  expect(total).toBeGreaterThanOrEqual(10);
  const vistas = new Set<string>();
  for (let i = 0; i < total; i++) {
    const origem = (await links.nth(i).getAttribute("data-origem")) as Origem;
    const texto = mensagem(await links.nth(i).getAttribute("href"));
    expect(texto.startsWith(origens[origem]), `${origem}: ${texto}`).toBe(true);
    expect(texto).toMatch(/Código: JV-[2-9A-HJ-NP-Z]{4}$/);
    vistas.add(origem);
  }
  // As cinco origens da tabela do plano estão presentes
  for (const o of ["topo", "checklist", "venda", "heranca", "rodape"]) expect(vistas.has(o)).toBe(true);
});

test("o código de atendimento é o mesmo em todos os botões e persiste entre visitas", async ({ page }) => {
  await page.goto("/");
  await waitHydrated(page);
  const codigos = await page
    .locator("a[data-origem]")
    .evaluateAll((els) => els.map((a) => new URL((a as HTMLAnchorElement).href).searchParams.get("text")?.match(/JV-\w{4}/)?.[0]));
  expect(new Set(codigos).size).toBe(1);
  await page.reload();
  // Após a hidratação o código volta a entrar na mensagem
  await expect
    .poll(() => page.locator('a[data-origem="topo"]').evaluate((a) => (a as HTMLAnchorElement).href.match(/JV-\w{4}/)?.[0]))
    .toBe(codigos[0]);
});

test("clique no WhatsApp registra o evento com a origem e envia ao coletor", async ({ page }) => {
  await blockWhatsApp(page);
  const enviados: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/events")) enviados.push(r.postData() ?? "");
  });
  await page.goto("/?utm_source=meta&utm_campaign=venda-travada&utm_content=video1");
  const popup = page.waitForEvent("popup");
  await page.locator('a[data-origem="topo"]').click();
  await (await popup).close();

  const eventos = await dataLayerEvents(page);
  const clique = eventos.find((e) => e.event === "whatsapp_click");
  expect(clique?.origem).toBe("topo");
  expect(clique?.utm_campaign).toBe("venda-travada");
  await expect.poll(() => enviados.some((b) => b.includes('"whatsapp_click"') && b.includes("venda-travada"))).toBe(true);
});

test("funil: chegada, leitura do checklist e rolagem 50/90", async ({ page }) => {
  await page.goto("/?utm_source=meta");
  await scrollThrough(page);
  const nomes = (await dataLayerEvents(page)).map((e) => e.event);
  for (const n of ["page_view", "checklist_lido", "scroll_50", "scroll_90"]) expect(nomes).toContain(n);
  expect(nomes.filter((n) => n === "scroll_50")).toHaveLength(1);
});

test("checklist: o que foi marcado vai na mensagem do WhatsApp", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitHydrated(page);
  const opcoes = page.locator("#checklist label.check-row");
  await expect(opcoes).toHaveCount(4);

  await opcoes.nth(1).click();
  await opcoes.nth(2).click();
  await expect(page.locator("#checklist [aria-live]")).toContainText("Os 2 pontos marcados");

  const texto = mensagem(await page.locator('a[data-origem="checklist"]').getAttribute("href"));
  expect(texto).toContain(origens.checklist);
  expect(texto).toContain("• A área construída é diferente da registrada");
  expect(texto).toContain("• Os limites do terreno não batem com os documentos");
  expect(texto).not.toContain("documentação está desatualizada");

  await opcoes.nth(1).click(); // desmarcar
  await expect(page.locator("#checklist [aria-live]")).toContainText("O ponto marcado vai");
});

test("checklist funciona só com teclado e mostra o foco", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "teclado físico: só no desktop");
  await page.goto("/");
  await waitHydrated(page);
  const caixa = page.locator('#checklist input[value="documentacao"]');
  await caixa.focus();
  await page.keyboard.press("Space");
  await expect(caixa).toBeChecked();
  const outline = await page.locator("#checklist label.check-row").first().evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("solid");
});

test("FAQ: abre e fecha por teclado, e resposta fechada não recebe foco", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "teclado físico: só no desktop");
  await page.goto("/");
  const botoes = page.locator("section[aria-labelledby='faq-titulo'] button[aria-expanded]");
  const segundo = botoes.nth(1);
  await expect(segundo).toHaveAttribute("aria-expanded", "false");
  const painel = page.locator(`#${await segundo.getAttribute("aria-controls")}`);
  await expect(painel).toBeHidden();

  await segundo.focus();
  await page.keyboard.press("Enter");
  await expect(segundo).toHaveAttribute("aria-expanded", "true");
  await expect(painel).toBeVisible();
  await expect(botoes.nth(0)).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Space");
  await expect(segundo).toHaveAttribute("aria-expanded", "false");
});

for (const largura of [320, 390, 768, 1024]) {
  test(`sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto("/");
    await scrollThrough(page, 1);
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
}

test("zoom de texto 200%: nada estoura a largura", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/");
  await page.addStyleTag({ content: "html{font-size:200% !important}" });
  await page.waitForTimeout(300);
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client + 1);
});

test("alvos de toque têm pelo menos 44×44 px", async ({ page }) => {
  await page.goto("/");
  await scrollThrough(page, 1);
  const pequenos = await page.evaluate(() => {
    const alvos = Array.from(document.querySelectorAll<HTMLElement>("a[href], button, label.check-row"));
    return alvos
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.visibility === "hidden" || s.display === "none" || el.closest("[inert]")) return false;
        if (el.classList.contains("sr-only-focusable")) return false; // link de pular conteúdo: só aparece no foco
        let opacidade = 1;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) opacidade *= Number(getComputedStyle(n).opacity);
        if (opacidade < 0.1) return false; // slide fora de foco do carrossel
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return false;
        return r.height < 44 || r.width < 44;
      })
      .map((el) => `${el.tagName} "${el.textContent?.trim().slice(0, 40)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
  });
  expect(pequenos).toEqual([]);
});

test("barra fixa (celular): escondida no topo, aparece depois do CTA principal e some no CTA final", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "a barra fixa existe só no celular");
  await page.goto("/");
  const barra = page.locator(".sticky-cta");
  await expect(barra).toHaveAttribute("data-visible", "false");
  await expect(barra).toHaveAttribute("inert", "");

  await page.locator("#checklist").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 400));
  await expect(barra).toHaveAttribute("data-visible", "true");
  await expect(barra.locator("a[data-origem='barra-fixa']")).toBeVisible();

  await page.locator("#cta-final").scrollIntoViewIfNeeded();
  await expect(barra).toHaveAttribute("data-visible", "false");
});

test("foco por teclado nunca fica escondido atrás da barra fixa (WCAG 2.4.11)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#checklist").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 400));
  const escondidos: string[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60); // a correção de rolagem roda no frame seguinte
    const r = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      if (el.closest(".sticky-cta")) return null;
      // Caixas de seleção escondidas: o indicador de foco visível é o rótulo.
      const alvo = el.closest("label") ?? el;
      const box = alvo.getBoundingClientRect();
      const x = Math.min(Math.max(box.left + box.width / 2, 1), window.innerWidth - 1);
      const y = Math.min(Math.max(box.top + box.height / 2, 1), window.innerHeight - 1);
      const topo = document.elementFromPoint(x, y);
      const coberto = !!topo?.closest(".sticky-cta");
      return coberto ? `${el.tagName} "${el.textContent?.trim().slice(0, 40)}"` : null;
    });
    if (r) escondidos.push(r);
  }
  expect(escondidos).toEqual([]);
});

test("coletor de eventos rejeita payload inválido", async ({ request }) => {
  const ruim = await request.post("/api/events", { data: { event: "hack", eventId: "x" } });
  expect(ruim.status()).toBe(400);
  const bom = await request.post("/api/events", { data: { event: "page_view", eventId: "abc", props: {}, attribution: {} } });
  expect(bom.status()).toBe(204);
});

test("checklist: o que foi marcado antes do JS carregar não se perde", async ({ page }) => {
  // Simula 4G lento: os chunks de JS chegam 2 s depois do HTML
  await page.route("**/_next/static/chunks/**", async (route) => {
    await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await page.locator("#checklist label.check-row").nth(1).click();
  await waitHydrated(page);
  await expect(page.locator("#checklist [aria-live]")).toContainText("O ponto marcado vai");
  const texto = mensagem(await page.locator('a[data-origem="checklist"]').getAttribute("href"));
  expect(texto).toContain("• A área construída é diferente da registrada");
});

test("tocar num texto com a barra fixa visível não rola a página", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "a barra fixa existe só no celular");
  await page.goto("/");
  await waitHydrated(page);
  await page.locator("#checklist").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 400));
  await expect(page.locator(".sticky-cta")).toHaveAttribute("data-visible", "true");
  const antes = await page.evaluate(() => window.scrollY);
  await page.mouse.click(4, 300); // margem lateral: área não interativa dentro do <main>
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(antes);
});
