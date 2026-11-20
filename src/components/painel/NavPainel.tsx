"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type MouseEvent, type SVGProps, Suspense } from "react";
import { IconeCampanhas, IconeConfig, IconeLeads, IconeSite, IconeVisao } from "./icones";

const ITENS: { href: string; nome: string; curto: string; Icone: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: "/admin", nome: "Visão geral", curto: "Visão", Icone: IconeVisao },
  { href: "/admin/campanhas", nome: "Campanhas", curto: "Campanhas", Icone: IconeCampanhas },
  { href: "/admin/comportamento", nome: "No site", curto: "No site", Icone: IconeSite },
  { href: "/admin/leads", nome: "Leads", curto: "Leads", Icone: IconeLeads },
  { href: "/admin/configuracao", nome: "Configuração", curto: "Ajustes", Icone: IconeConfig },
];

const FILTROS_GLOBAIS = ["periodo", "de", "ate", "pagina", "fonte", "campanha", "dispositivo"];

type Ativo = (href: string) => boolean;

/** Ao trocar de tela, o período e os filtros escolhidos continuam valendo. */
function useManterFiltros() {
  const router = useRouter();
  return (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || href === "/admin/configuracao") return;
    const atual = new URLSearchParams(window.location.search);
    const manter = new URLSearchParams();
    for (const chave of FILTROS_GLOBAIS) {
      const v = atual.get(chave);
      if (v) manter.set(chave, v);
    }
    const s = manter.toString();
    if (!s) return;
    e.preventDefault();
    router.push(`${href}?${s}`);
  };
}

function ListaLateral({ ativo }: { ativo: Ativo }) {
  const aoClicar = useManterFiltros();
  return (
    <nav aria-label="Painel" className="mt-8 flex flex-col gap-1">
      {ITENS.map(({ href, nome, Icone }) => {
        const on = ativo(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={aoClicar(href)}
            aria-current={on ? "page" : undefined}
            className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[0.9375rem] font-medium transition-colors ${
              on ? "bg-white/10 text-white" : "text-[#afbcd1] hover:bg-white/5 hover:text-white"
            }`}
          >
            {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#cca85e]" aria-hidden="true" />}
            <Icone className={`size-5 ${on ? "text-[#cca85e]" : ""}`} />
            {nome}
          </Link>
        );
      })}
    </nav>
  );
}

function ListaInferior({ ativo }: { ativo: Ativo }) {
  const aoClicar = useManterFiltros();
  return (
    <nav aria-label="Painel" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#002448] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITENS.map(({ href, curto, Icone }) => {
          const on = ativo(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={aoClicar(href)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium ${on ? "text-white" : "text-[#afbcd1]"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${on ? "bg-white/15 text-[#cca85e]" : ""}`}>
                  <Icone className="size-5" />
                </span>
                {curto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function useAtivo(): Ativo {
  const pathname = usePathname();
  return (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
}

function LateralComCaminho() {
  return <ListaLateral ativo={useAtivo()} />;
}

function InferiorComCaminho() {
  return <ListaInferior ativo={useAtivo()} />;
}

const nenhum: Ativo = () => false;

// O caminho atual é dado de requisição: em rota dinâmica fica dentro de Suspense. Enquanto não
// chega, o menu aparece igual, só sem o item ativo destacado.
export function NavLateral() {
  return (
    <Suspense fallback={<ListaLateral ativo={nenhum} />}>
      <LateralComCaminho />
    </Suspense>
  );
}

export function NavInferior() {
  return (
    <Suspense fallback={<ListaInferior ativo={nenhum} />}>
      <InferiorComCaminho />
    </Suspense>
  );
}
