/**
 * Blocos do painel que não precisam de JavaScript: cartão, indicador (stat tile) com minigráfico,
 * funil, barra segmentada e estado vazio. Renderizados no servidor.
 */
import type { ReactNode } from "react";
import { pct, variacao } from "@/lib/painel/formato";
import { COR } from "./tema";

export function Cartao({
  titulo,
  subtitulo,
  acoes,
  children,
  className = "",
  id,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`painel-cartao flex min-w-0 flex-col ${className}`} aria-label={typeof titulo === "string" ? titulo : undefined}>
      {(titulo || acoes) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            {titulo && <h2 className="text-[0.9688rem] font-semibold leading-snug text-[#0a1f3f]">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-[0.8125rem] leading-snug text-[#5b677a]">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex shrink-0 items-center gap-1">{acoes}</div>}
        </header>
      )}
      <div className="flex min-w-0 flex-1 flex-col px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

/** Minigráfico de tendência (SVG, sem eixo): a linha do período e o ponto do dia atual. */
export function Minigrafico({ valores, cor = COR.serie[0], altura = 36, className = "" }: { valores: number[]; cor?: string; altura?: number; className?: string }) {
  if (valores.length < 2) return null;
  const largura = 120;
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  const faixa = max - min || 1;
  const x = (i: number) => (i / (valores.length - 1)) * largura;
  const y = (v: number) => altura - 3 - ((v - min) / faixa) * (altura - 6);
  const pontos = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ultimo = valores.length - 1;
  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" className={`h-9 w-full overflow-visible ${className}`} aria-hidden="true">
      <polygon points={`0,${altura} ${pontos} ${largura},${altura}`} fill={cor} opacity={0.1} />
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(ultimo)} cy={y(valores[ultimo])} r={3.2} fill={cor} stroke={COR.superficie} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Variação contra o período anterior. A cor diz se a mudança é boa (custo que cai é bom),
 * sempre com seta e texto: a cor nunca carrega o sentido sozinha.
 */
export function Variacao({ atual, anterior, melhorSeSobe = true, sufixo = "vs. período anterior" }: { atual: number | null; anterior: number | null; melhorSeSobe?: boolean; sufixo?: string }) {
  const v = variacao(atual, anterior);
  if (v === null) return <p className="text-[0.8125rem] text-[#6b7688]">Sem base de comparação</p>;
  const estavel = Math.abs(v) < 0.005;
  const bom = estavel ? null : v > 0 === melhorSeSobe;
  const cor = bom === null ? "text-[#4a5870] bg-[#eef1f6]" : bom ? "text-[#006300] bg-[#e7f6e7]" : "text-[#b42318] bg-[#fdecea]";
  const seta = estavel ? "→" : v > 0 ? "↑" : "↓";
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-[#6b7688]">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums ${cor}`}>
        <span aria-hidden="true">{seta}</span>
        {pct(Math.abs(v))}
        <span className="sr-only">{estavel ? "estável" : v > 0 ? "de alta" : "de queda"}</span>
      </span>
      {sufixo}
    </p>
  );
}

/** Indicador: rótulo, valor, variação e tendência (contrato do stat tile). */
export function Kpi({
  rotulo,
  valor,
  atual = null,
  anterior,
  melhorSeSobe = true,
  serie,
  dica,
  destaque = false,
  nota,
}: {
  rotulo: string;
  valor: string;
  atual?: number | null;
  /** Sem `anterior`, o indicador não mostra comparação (use `nota` para um complemento). */
  anterior?: number | null;
  melhorSeSobe?: boolean;
  serie?: number[];
  dica?: string;
  destaque?: boolean;
  nota?: string;
}) {
  return (
    <div className={`painel-cartao flex min-w-0 flex-col gap-2 px-5 py-4 ${destaque ? "ring-1 ring-[#cca85e]/60" : ""}`}>
      <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[#4a5870]" title={dica}>
        {rotulo}
        {dica && (
          <span className="grid size-4 place-items-center rounded-full border border-[#c3cbd6] text-[0.625rem] text-[#6b7688]" aria-hidden="true">
            ?
          </span>
        )}
        {dica && <span className="sr-only">. {dica}</span>}
      </p>
      <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.01em] text-[#0a1f3f]">{valor}</p>
      {anterior !== undefined && <Variacao atual={atual} anterior={anterior} melhorSeSobe={melhorSeSobe} />}
      {nota && <p className="text-[0.8125rem] text-[#6b7688]">{nota}</p>}
      {serie && <Minigrafico valores={serie} />}
    </div>
  );
}

/**
 * Branco ou preto sobre uma cor, o que der mais contraste (WCAG 2). Preto puro: sobre o azul
 * #2a78d6 o quase preto fica em 4,46:1 e o preto chega a 4,76:1 (o mínimo AA é 4,5).
 */
export function tintaSobre(hex: string) {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? "#ffffff" : "#000000";
}

export type Etapa = { nome: string; valor: number; descricao?: string };

/** Funil: uma rampa azul ordinal, conversão de cada etapa para a anterior e para o topo. */
export function Funil({ etapas }: { etapas: Etapa[] }) {
  const topo = etapas[0]?.valor || 0;
  return (
    <ol className="flex flex-col gap-3.5" aria-label="Funil de conversão">
      {etapas.map((e, i) => {
        const largura = topo ? Math.max(e.valor > 0 ? 1.5 : 0, (e.valor / topo) * 100) : 0;
        const anterior = i > 0 ? etapas[i - 1].valor : null;
        const detalhe = [anterior !== null ? `${anterior ? pct(Math.min(1, e.valor / anterior)) : "—"} da etapa anterior` : null, e.descricao].filter(Boolean).join(" · ");
        return (
          <li key={e.nome}>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[0.875rem] font-medium leading-snug text-[#0a1f3f]">{e.nome}</span>
              <span className="text-[0.9375rem] font-semibold tabular-nums text-[#0a1f3f]">{e.valor.toLocaleString("pt-BR")}</span>
            </p>
            <div className="mt-1.5 h-5 rounded-[4px] bg-[#f0f3f7]">
              <div className="h-full rounded-[4px] transition-[width] duration-700" style={{ width: `${largura}%`, background: COR.funil[Math.min(i, COR.funil.length - 1)] }} />
            </div>
            {detalhe && <p className="mt-1 text-[0.75rem] leading-snug text-[#6b7688]">{detalhe}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Barra segmentada alta (≤ 6 partes): cada parte com sua fatia impressa quando cabe, e legenda. */
export function BarraSegmentada({ partes, rotulo }: { partes: { nome: string; valor: number; cor: string }[]; rotulo: string }) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (!total) return <EstadoVazio texto="Sem dados neste período." compacto />;
  return (
    <div>
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={`${rotulo}: ${partes.map((p) => `${p.nome} ${pct(p.valor / total)}`).join(", ")}`}>
        {partes
          .filter((p) => p.valor > 0)
          .map((p) => {
            const fatia = p.valor / total;
            return (
              <div
                key={p.nome}
                className="flex h-full items-center rounded-[4px] px-2 text-[0.75rem] font-semibold"
                style={{ width: `${fatia * 100}%`, background: p.cor, color: tintaSobre(p.cor) }}
                title={`${p.nome}: ${pct(fatia)}`}
              >
                {fatia >= 0.12 ? pct(fatia, 0) : ""}
              </div>
            );
          })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.8125rem] text-[#4a5870]">
        {partes.map((p) => (
          <li key={p.nome} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: p.cor }} aria-hidden="true" />
            {p.nome}
            <span className="tabular-nums text-[#6b7688]">{pct(p.valor / total, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EstadoVazio({ texto, compacto = false, children }: { texto: string; compacto?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d5dce6] text-center text-[0.875rem] text-[#5b677a] ${compacto ? "px-4 py-6" : "px-6 py-12"}`}>
      <svg viewBox="0 0 24 24" className="size-6 text-[#9aa6b6]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </svg>
      <p className="max-w-[28rem]">{texto}</p>
      {children}
    </div>
  );
}
