import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { excluirLead } from "@/app/admin/acoes";
import { Cartao } from "@/components/painel/blocos";
import { EsqueletoPainel, SemBanco } from "@/components/painel/estados";
import { BotaoExcluir, FormLead } from "@/components/painel/FormLead";
import { IconeVoltar } from "@/components/painel/icones";
import { SeloStatus } from "@/components/painel/StatusLead";
import { paginaGeorreferenciamento } from "@/content/georreferenciamento";
import { paginaRegularizacao } from "@/content/site";
import { SECOES } from "@/lib/eventos";
import { contextoPainel } from "@/lib/painel/contexto";
import { dataHora, NOMES_DISPOSITIVO, nomeOrigem, nomePagina } from "@/lib/painel/formato";

export const metadata: Metadata = { title: "Lead" };

export default function PaginaLead({ params }: PageProps<"/admin/leads/[codigo]">) {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

type Evento = {
  nome: string;
  ts: string | null;
  pagina: string | null;
  origem: string | null;
  props: Record<string, unknown>;
  fonte: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  dispositivo: string | null;
  navegador: string | null;
  cidade: string | null;
  sessao: string | null;
};

const itensChecklist = new Map(
  [...paginaRegularizacao.checklist.itens, ...paginaGeorreferenciamento.checklist.itens].map((i) => [i.id, i.texto] as const),
);
const nomeSecao = new Map<string, string>(SECOES.map((s) => [s.id, s.nome]));
const CANAIS: Record<string, string> = { telefone: "telefone", instagram: "Instagram", email: "e-mail" };

function descrever(e: Evento): { texto: string; detalhe?: string; forte?: boolean } | null {
  const p = e.props ?? {};
  switch (e.nome) {
    case "page_view":
      return {
        texto: `Abriu a página ${nomePagina(e.pagina)}`,
        detalhe: e.utm_campaign ? `Campanha “${e.utm_campaign}”${e.utm_content ? `, anúncio “${e.utm_content}”` : ""}` : (e.fonte ?? undefined),
      };
    case "checklist_lido":
      return { texto: "Chegou ao autodiagnóstico" };
    case "checklist_marcado":
      return { texto: `${p.marcado === false ? "Desmarcou" : "Marcou"}: ${itensChecklist.get(String(p.item)) ?? p.item}`, forte: p.marcado !== false };
    case "scroll_50":
      return { texto: "Rolou metade da página" };
    case "scroll_90":
      return { texto: "Chegou ao fim da página" };
    case "faq_aberta":
      return { texto: `Abriu a pergunta “${p.pergunta}”` };
    case "comparador_usado":
      return { texto: "Mexeu no comparador projeto × foto" };
    case "autodiagnostico_click":
      return { texto: "Clicou em “Fazer o autodiagnóstico”" };
    case "navegacao_click":
      return { texto: `Foi para ${p.destino === "/georreferenciamento" ? "a página rural" : String(p.destino ?? "outra seção")}` };
    case "contato_click":
      return { texto: `Clicou no ${CANAIS[String(p.canal)] ?? p.canal} do rodapé` };
    case "whatsapp_click":
      return { texto: "Chamou no WhatsApp", detalhe: nomeOrigem(e.origem), forte: true };
    default:
      return null;
  }
}

function duracao(segundos: number) {
  if (segundos >= 300) return "mais de 5 min";
  if (segundos >= 60) return `${Math.floor(segundos / 60)} min`;
  return `${segundos} s`;
}

async function Conteudo({ params }: { params: PageProps<"/admin/leads/[codigo]">["params"] }) {
  const { codigo } = await params;
  const ctx = await contextoPainel();
  if (!ctx.consultas) return <SemBanco erro={ctx.erro} />;
  const dados = await ctx.consultas.lead(decodeURIComponent(codigo).slice(0, 20));
  if (!dados) notFound();
  const { lead, eventos } = dados;

  // Visitas (sessões) na ordem, com as seções vistas resumidas numa linha só.
  const sessoes: { id: string; inicio: string | null; eventos: Evento[] }[] = [];
  for (const e of eventos as Evento[]) {
    const atual = sessoes.find((s) => s.id === (e.sessao ?? "sem-sessao"));
    if (atual) atual.eventos.push(e);
    else sessoes.push({ id: e.sessao ?? "sem-sessao", inicio: e.ts, eventos: [e] });
  }

  const origem: [string, string | null | undefined][] = [
    ["Botão", nomeOrigem(lead.origem)],
    ["Fonte", lead.fonte],
    ["Campanha", lead.utm_campaign],
    ["Conjunto", lead.utm_term],
    ["Anúncio", lead.utm_content],
    ["Página", lead.pagina ? nomePagina(lead.pagina) : null],
    ["Aparelho", lead.dispositivo ? NOMES_DISPOSITIVO[lead.dispositivo] ?? lead.dispositivo : null],
    ["Cidade", lead.cidade],
  ];

  return (
    <>
      <header className="px-4 pb-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <Link href="/admin/leads" className="inline-flex min-h-10 items-center gap-2 text-[0.875rem] font-semibold text-[#1c5cab]">
          <IconeVoltar className="size-[18px]" />
          Leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-[1.75rem] font-semibold uppercase leading-none text-[#0a1f3f] sm:text-[2rem]">{lead.nome ?? lead.codigo}</h1>
          <SeloStatus status={lead.status} />
        </div>
        <p className="mt-2 text-[0.875rem] text-[#5b677a]">
          <span className="font-mono">{lead.codigo}</span> · primeira conversa em {dataHora(lead.criado_em)}
          {lead.manual && " · cadastrado à mão"}
        </p>
      </header>

      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:px-8 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-7">
          <Cartao titulo="Andamento e contrato" subtitulo="O que for marcado aqui alimenta o funil, o custo por cliente e o retorno das campanhas.">
            <FormLead lead={lead} />
          </Cartao>
          <div className="px-1">
            <BotaoExcluir acao={excluirLead} codigo={lead.codigo} />
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <Cartao titulo="De onde veio">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2.5 text-[0.875rem]">
              {origem
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-[#6b7688]">{k}</dt>
                    <dd className="break-words font-medium text-[#0a1f3f]">{v}</dd>
                  </div>
                ))}
            </dl>
          </Cartao>

          <Cartao titulo="O que fez no site" subtitulo={sessoes.length ? `${sessoes.length} ${sessoes.length === 1 ? "visita" : "visitas"} deste aparelho.` : undefined}>
            {sessoes.length ? (
              <ol className="flex flex-col gap-5">
                {sessoes.map((s, i) => {
                  const atencao = Math.max(0, ...s.eventos.filter((e) => e.nome === "engajamento").map((e) => Number(e.props?.segundos ?? 0)));
                  const secoes = s.eventos.filter((e) => e.nome === "secao_vista").map((e) => nomeSecao.get(String(e.props?.secao)) ?? String(e.props?.secao));
                  const primeiro = s.eventos[0];
                  const linhas = s.eventos.map(descrever).filter(Boolean) as { texto: string; detalhe?: string; forte?: boolean }[];
                  return (
                    <li key={s.id}>
                      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#7e5f20]">
                        Visita {i + 1} · {dataHora(s.inicio)}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-[#6b7688]">
                        {[primeiro?.dispositivo && NOMES_DISPOSITIVO[primeiro.dispositivo], primeiro?.navegador, primeiro?.cidade, atencao ? `ficou ${duracao(atencao)}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <ul className="mt-2 flex flex-col border-l-2 border-[#e3e8ef] pl-4">
                        {linhas.map((l, j) => (
                          <li key={j} className="relative py-1.5 text-[0.875rem]">
                            <span
                              className={`absolute -left-[1.3rem] top-[0.8rem] size-2.5 rounded-full border-2 border-white ${l.forte ? "bg-[#cca85e]" : "bg-[#9aa6b6]"}`}
                              aria-hidden="true"
                            />
                            <span className={l.forte ? "font-semibold text-[#0a1f3f]" : "text-[#0a1f3f]"}>{l.texto}</span>
                            {l.detalhe && <span className="block text-[0.75rem] text-[#6b7688]">{l.detalhe}</span>}
                          </li>
                        ))}
                        {secoes.length > 0 && (
                          <li className="relative py-1.5 text-[0.875rem] text-[#4a5870]">
                            <span className="absolute -left-[1.3rem] top-[0.8rem] size-2.5 rounded-full border-2 border-white bg-[#9aa6b6]" aria-hidden="true" />
                            Viu as seções: {secoes.join(", ")}
                          </li>
                        )}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-[0.875rem] text-[#5b677a]">
                {lead.manual ? "Lead cadastrado à mão: não há visitas ligadas a ele." : "Nenhum evento encontrado para este código."}
              </p>
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
}
