import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sessão do painel: uma senha (ADMIN_PASSWORD) e um cookie assinado com validade de 30 dias.
 * O cookie guarda só a validade e a assinatura; trocar a senha na Vercel derruba todas as sessões.
 *
 * Fora da Vercel (máquina local), sem ADMIN_PASSWORD, a senha é "jusvertice" para desenvolver.
 */

export const COOKIE_SESSAO = "jv_admin";
export const COOKIE_DEMO = "jv_painel_demo";
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 30;

export function senhaDoPainel(): string | null {
  const senha = process.env.ADMIN_PASSWORD;
  if (senha) return senha;
  return process.env.VERCEL ? null : "jusvertice";
}

function segredo(): string | null {
  const senha = senhaDoPainel();
  if (!senha) return null;
  return `${process.env.ADMIN_SESSION_SECRET ?? ""}:${senha}`;
}

function assinatura(validade: number, chave: string) {
  return createHmac("sha256", chave).update(`jv-admin.${validade}`).digest("base64url");
}

export function criarSessao(): string | null {
  const chave = segredo();
  if (!chave) return null;
  const validade = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_S;
  return `${validade}.${assinatura(validade, chave)}`;
}

export function sessaoValida(valor: string | undefined): boolean {
  const chave = segredo();
  if (!chave || !valor) return false;
  const [validadeTexto, assinado] = valor.split(".");
  const validade = Number(validadeTexto);
  if (!Number.isFinite(validade) || validade < Date.now() / 1000 || !assinado) return false;
  const esperado = Buffer.from(assinatura(validade, chave));
  const recebido = Buffer.from(assinado);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export function senhaConfere(tentativa: string): boolean {
  const senha = senhaDoPainel();
  if (!senha) return false;
  // Compara os resumos, que têm o mesmo tamanho: o tempo não revela o tamanho da senha.
  const a = createHmac("sha256", "jv-senha").update(tentativa).digest();
  const b = createHmac("sha256", "jv-senha").update(senha).digest();
  return timingSafeEqual(a, b);
}
