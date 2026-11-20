import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type Banco, type Esquema, obterBanco } from "@/lib/db";
import { criarConsultas } from "./consultas";
import { COOKIE_DEMO, COOKIE_SESSAO, sessaoValida } from "./sessao";

/**
 * Confere a sessão no servidor (o proxy é só a checagem otimista). O painel é sempre da hora:
 * connection() tira tudo daqui em diante da pré-renderização (validade da sessão e "hoje" leem o relógio).
 */
export async function exigirAdmin() {
  await connection();
  const jarra = await cookies();
  if (!sessaoValida(jarra.get(COOKIE_SESSAO)?.value)) redirect("/admin/entrar");
  return jarra;
}

export type ContextoPainel = {
  banco: Banco | null;
  erro: string | null;
  demo: boolean;
  esquema: Esquema;
  consultas: ReturnType<typeof criarConsultas> | null;
};

/** Sessão + banco + esquema (real ou demonstração) para uma página do painel. */
export async function contextoPainel(): Promise<ContextoPainel> {
  const jarra = await exigirAdmin();
  const demo = jarra.get(COOKIE_DEMO)?.value === "1";
  const esquema: Esquema = demo ? "demo" : "public";
  let banco: Banco | null = null;
  let erro: string | null = null;
  try {
    banco = await obterBanco();
  } catch (e) {
    erro = (e as Error).message;
  }
  return { banco, erro, demo, esquema, consultas: banco ? criarConsultas(banco, esquema) : null };
}
