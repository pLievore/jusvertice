import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSAO, sessaoValida } from "@/lib/painel/sessao";

/**
 * Barra o painel para quem não entrou: tudo em /admin, menos a tela de entrada, exige a sessão.
 * É a checagem otimista; cada ação do painel confere a sessão de novo no servidor.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/admin/entrar")) return NextResponse.next();
  if (sessaoValida(request.cookies.get(COOKIE_SESSAO)?.value)) return NextResponse.next();
  const destino = new URL("/admin/entrar", request.url);
  destino.searchParams.set("volta", pathname + search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
