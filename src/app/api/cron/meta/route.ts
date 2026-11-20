import { obterBanco } from "@/lib/db";
import { sincronizarMeta } from "@/lib/painel/meta-ads";

/**
 * Sincronização diária com a Meta, chamada pelo cron da Vercel (vercel.json).
 * A Vercel manda "Authorization: Bearer <CRON_SECRET>"; sem o segredo certo, nada roda.
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const banco = await obterBanco();
  if (!banco) return Response.json({ ok: false, mensagem: "Banco não configurado." }, { status: 503 });
  const resultado = await sincronizarMeta(banco);
  return Response.json(resultado, { status: resultado.ok ? 200 : 502 });
}
