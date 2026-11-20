"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterBanco } from "@/lib/db";
import { contextoPainel, exigirAdmin } from "@/lib/painel/contexto";
import { apagarDadosDemo, gravarDadosDemo } from "@/lib/painel/demo";
import { STATUS_LEAD } from "@/lib/painel/formato";
import { sincronizarMeta } from "@/lib/painel/meta-ads";
import { COOKIE_DEMO, COOKIE_SESSAO, criarSessao, DURACAO_SESSAO_S, senhaConfere, senhaDoPainel } from "@/lib/painel/sessao";

export type EstadoForm = { erro?: string; ok?: string } | null;

const cookieSeguro = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL), path: "/" };

/** Só caminhos do próprio painel servem de volta depois de entrar (nada de redirecionar para fora). */
function destinoSeguro(volta: FormDataEntryValue | null) {
  const texto = typeof volta === "string" ? volta : "";
  return /^\/admin(?:[/?#]|$)/.test(texto) && !texto.startsWith("//") ? texto : "/admin";
}

export async function entrar(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  if (!senhaDoPainel()) return { erro: "A senha do painel ainda não foi definida (ADMIN_PASSWORD na Vercel)." };
  const senha = String(dados.get("senha") ?? "");
  if (!senha || !senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 700)); // freia tentativas em sequência
    return { erro: "Senha incorreta." };
  }
  const sessao = criarSessao();
  if (!sessao) return { erro: "Não foi possível abrir a sessão." };
  (await cookies()).set(COOKIE_SESSAO, sessao, { ...cookieSeguro, maxAge: DURACAO_SESSAO_S });
  redirect(destinoSeguro(dados.get("volta")));
}

export async function sair() {
  const jarra = await cookies();
  jarra.delete(COOKIE_SESSAO);
  redirect("/admin/entrar");
}

export async function alternarDemo(ligar: boolean) {
  const jarra = await exigirAdmin();
  if (ligar) jarra.set(COOKIE_DEMO, "1", { ...cookieSeguro, maxAge: 60 * 60 * 24 * 30 });
  else jarra.delete(COOKIE_DEMO);
  revalidatePath("/admin", "layout");
}

export async function gerarDemo(): Promise<EstadoForm> {
  await exigirAdmin();
  const banco = await obterBanco();
  if (!banco) return { erro: "Banco não configurado." };
  const total = await gravarDadosDemo(banco);
  (await cookies()).set(COOKIE_DEMO, "1", { ...cookieSeguro, maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/admin", "layout");
  return { ok: `Pronto: ${total.eventos.toLocaleString("pt-BR")} eventos, ${total.leads} leads e ${total.anuncios} linhas de anúncios.` };
}

export async function apagarDemo(): Promise<EstadoForm> {
  const jarra = await exigirAdmin();
  const banco = await obterBanco();
  if (!banco) return { erro: "Banco não configurado." };
  await apagarDadosDemo(banco);
  jarra.delete(COOKIE_DEMO);
  revalidatePath("/admin", "layout");
  return { ok: "Dados de demonstração apagados." };
}

export async function sincronizarAgora(): Promise<EstadoForm> {
  const { banco, demo } = await contextoPainel();
  if (!banco) return { erro: "Banco não configurado." };
  if (demo) return { erro: "Saia do modo de demonstração para sincronizar os dados reais." };
  const resultado = await sincronizarMeta(banco);
  revalidatePath("/admin", "layout");
  return resultado.ok ? { ok: resultado.mensagem } : { erro: resultado.mensagem };
}

const STATUS_VALIDOS = new Set<string>(STATUS_LEAD.map((s) => s.id));

function lerValor(texto: FormDataEntryValue | null) {
  const t = String(texto ?? "").trim();
  if (!t) return null;
  // Aceita "4.500,00", "4500,5" e "4500.50".
  const normal = t.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : Number.NaN;
}

const curto = (v: FormDataEntryValue | null, max: number) => {
  const t = String(v ?? "").trim();
  return t ? t.slice(0, max) : null;
};

export async function salvarLead(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const { banco, esquema } = await contextoPainel();
  if (!banco) return { erro: "Banco não configurado." };
  const codigo = String(dados.get("codigo") ?? "");
  const status = String(dados.get("status") ?? "");
  if (!STATUS_VALIDOS.has(status)) return { erro: "Escolha um andamento." };
  const valor = lerValor(dados.get("valor"));
  if (Number.isNaN(valor)) return { erro: "Valor inválido. Use só números, por exemplo 4500,00." };
  await banco.query(
    `update ${esquema}.leads set status = $2, valor = $3, servico = $4, nome = $5, notas = $6, atualizado_em = now() where codigo = $1`,
    [codigo, status, valor, curto(dados.get("servico"), 120), curto(dados.get("nome"), 120), curto(dados.get("notas"), 2000)],
  );
  revalidatePath("/admin", "layout");
  return { ok: "Lead atualizado." };
}

export async function criarLead(_: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const { banco, esquema } = await contextoPainel();
  if (!banco) return { erro: "Banco não configurado." };
  const status = String(dados.get("status") ?? "nova");
  if (!STATUS_VALIDOS.has(status)) return { erro: "Escolha um andamento." };
  const valor = lerValor(dados.get("valor"));
  if (Number.isNaN(valor)) return { erro: "Valor inválido. Use só números, por exemplo 4500,00." };
  const nome = curto(dados.get("nome"), 120);
  if (!nome) return { erro: "Informe o nome." };
  const alfabeto = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const codigo = "MAN-" + Array.from({ length: 4 }, () => alfabeto[Math.floor(Math.random() * alfabeto.length)]).join("");
  const fonte = curto(dados.get("fonte"), 60) ?? "Indicação";
  await banco.query(
    `insert into ${esquema}.leads (codigo, status, valor, servico, nome, notas, manual, origem, fonte, criado_em, ultimo_contato)
     values ($1, $2, $3, $4, $5, $6, true, 'manual', $7, now(), now())`,
    [codigo, status, valor, curto(dados.get("servico"), 120), nome, curto(dados.get("notas"), 2000), fonte],
  );
  revalidatePath("/admin", "layout");
  redirect(`/admin/leads/${codigo}`);
}

export async function excluirLead(dados: FormData) {
  const { banco, esquema } = await contextoPainel();
  if (!banco) return;
  await banco.query(`delete from ${esquema}.leads where codigo = $1`, [String(dados.get("codigo") ?? "")]);
  revalidatePath("/admin", "layout");
  redirect("/admin/leads");
}
