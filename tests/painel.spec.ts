import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Senha local padrão (sem ADMIN_PASSWORD fora da Vercel). Em CI, defina ADMIN_PASSWORD igual nos dois lados.
const SENHA = process.env.ADMIN_PASSWORD ?? "jusvertice";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

test.describe.configure({ timeout: 180_000 });

async function entrarNoPainel(page: Page) {
  await page.goto("/admin/entrar");
  await page.fill('input[name="senha"]', SENHA);
  await Promise.all([page.waitForURL(/\/admin(\?|$)/, { timeout: 90_000 }), page.click('button[type="submit"]')]);
}

async function ligarDemonstracao(page: Page) {
  await page.goto("/admin/configuracao");
  await page.getByRole("button", { name: /Gerar (dados de demonstração|de novo)/ }).click();
  await expect(page.getByText(/^✓ Pronto:/)).toBeVisible({ timeout: 120_000 });
}

test("painel: sem sessão, qualquer tela leva para a entrada", async ({ page }) => {
  await page.goto("/admin/campanhas");
  await expect(page).toHaveURL(/\/admin\/entrar\?volta=%2Fadmin%2Fcampanhas/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Entrar");
});

test("painel: senha errada avisa; a certa entra e volta para a tela pedida", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "fluxo de entrada: só no desktop");
  await page.goto("/admin/leads");
  await page.fill('input[name="senha"]', "senha-errada");
  await page.click('button[type="submit"]');
  await expect(page.locator("#erro-senha")).toHaveText("Senha incorreta.");
  await page.fill('input[name="senha"]', SENHA);
  await Promise.all([page.waitForURL(/\/admin\/leads/), page.click('button[type="submit"]')]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Leads");
});

test("painel: fora do Google", async ({ page, request }) => {
  await page.goto("/admin/entrar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/admin/);
});

test("coletor grava o clique no WhatsApp, o lead aparece no painel e pode ser marcado como fechado", async ({ page, request }, info) => {
  test.skip(info.project.name === "celular", "fluxo de dados: só no desktop");
  const codigo = `JV-T${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const evento = (event: string, props: Record<string, unknown> = {}) =>
    request.post("/api/events", {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 350.0" },
      data: {
        event,
        eventId: `${codigo}-${event}-${Date.now()}`,
        props,
        attribution: { utm_source: "ig", utm_campaign: "Teste automático", utm_content: "Anúncio teste" },
        codigo,
        sessao: `sessao-${codigo}`,
        novo: true,
        url: "http://localhost/",
        ts: Date.now(),
      },
    });
  expect((await evento("page_view")).status()).toBe(204);
  expect((await evento("checklist_marcado", { item: "area", marcado: true })).status()).toBe(204);
  expect((await evento("whatsapp_click", { origem: "checklist" })).status()).toBe(204);

  await entrarNoPainel(page);
  // A gravação acontece depois da resposta do coletor: espera o lead aparecer na busca.
  await expect(async () => {
    await page.goto(`/admin/leads?busca=${codigo}`);
    await expect(page.getByRole("link", { name: new RegExp(codigo) }).first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });

  await page.getByRole("link", { name: new RegExp(codigo) }).first().click();
  await expect(page).toHaveURL(new RegExp(`/admin/leads/${codigo}`));
  await expect(page.getByText("Teste automático").first()).toBeVisible();
  await expect(page.getByText("Marcou: A área construída é diferente da registrada")).toBeVisible();
  await expect(page.getByText("Chamou no WhatsApp")).toBeVisible();

  // O Next 16 mantém a tela anterior escondida no DOM: buscar pelo papel acessível ignora o que está oculto.
  await page.getByRole("radio", { name: "Fechou", exact: true }).check({ force: true });
  await page.fill('input[name="valor"]', "4.500,00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("✓ Lead atualizado.")).toBeVisible();
  await page.reload();
  await expect(page.locator('input[name="valor"]')).toHaveValue("4.500,00");

  // Limpa: exclui o lead de teste.
  await page.getByRole("button", { name: "Excluir lead" }).click();
  await Promise.all([page.waitForURL(/\/admin\/leads$/), page.getByRole("button", { name: "Sim, excluir" }).click()]);
  await page.goto(`/admin/leads?busca=${codigo}`);
  await expect(page.getByText("Nenhum lead encontrado.")).toBeVisible();
});

test("painel com demonstração: todas as telas carregam sem erro e o filtro cruzado funciona", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "roda uma vez");
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await entrarNoPainel(page);
  await ligarDemonstracao(page);

  for (const [rota, titulo] of [
    ["/admin", "Visão geral"],
    ["/admin/campanhas", "Campanhas"],
    ["/admin/comportamento", "No site"],
    ["/admin/leads", "Leads"],
  ] as const) {
    await page.goto(rota);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(titulo);
    await expect(page.getByText("Você está vendo dados de demonstração")).toBeVisible();
  }

  // Clicar num botão do gráfico "Conversas por botão" filtra o painel inteiro por ele.
  await page.goto("/admin");
  const lista = page.getByRole("list", { name: "Conversas por botão" });
  await lista.getByRole("button").first().click();
  await expect(page).toHaveURL(/origem=/);
  await expect(page.getByRole("button", { name: /^Botão: .*\(remover filtro\)$/ })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).not.toHaveURL(/origem=/);

  // Trocar o período mantém o filtro de página ao trocar de tela.
  await page.getByRole("button", { name: "7 dias" }).click();
  await expect(page).toHaveURL(/periodo=7d/);
  await page.getByRole("navigation", { name: "Painel" }).first().getByRole("link", { name: "Campanhas" }).click();
  await expect(page).toHaveURL(/\/admin\/campanhas\?periodo=7d/);

  expect(erros).toEqual([]);
});

test("painel: axe sem violações (entrada, visão geral e leads)", async ({ page }, info) => {
  test.skip(info.project.name === "celular", "roda uma vez");
  await page.goto("/admin/entrar");
  const entrada = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(entrada.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);

  await entrarNoPainel(page);
  await ligarDemonstracao(page);
  for (const rota of ["/admin", "/admin/leads", "/admin/comportamento"]) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(violations.map((v) => `${rota} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  }
});

test("painel no celular: nada estoura a largura", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "só no celular");
  await entrarNoPainel(page);
  await ligarDemonstracao(page);
  for (const rota of ["/admin", "/admin/campanhas", "/admin/comportamento", "/admin/leads"]) {
    await page.goto(rota);
    await page.waitForLoadState("networkidle");
    const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(scroll, rota).toBeLessThanOrEqual(client);
  }
});
