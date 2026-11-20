"use client";

/**
 * "Arraste para comparar": à esquerda o PROJETO da casa (planta gerada da própria foto,
 * scripts/gerar-planta.mjs) com os problemas apontados por setas; à direita a FOTO do imóvel
 * regularizado. Como a planta sai da foto, cada linha do desenho cai em cima da mesma aresta real.
 *
 * - A caixa tem a proporção exata da imagem: as coordenadas dos apontamentos (em %) valem em
 *   qualquer largura.
 * - Desktop: etiqueta + linha até o ponto. Celular: só o marcador numerado, com a legenda abaixo
 *   (etiquetas sobre uma imagem de 390 px ficariam ilegíveis).
 * - Primeira aparição: abre mostrando o projeto inteiro, varre até o fim (foto inteira) e volta
 *   para o meio. Arrastar ou usar o teclado interrompe na hora.
 *   Movimento reduzido: já começa no meio, sem animação.
 * - Acessível: o divisor é um `role="slider"` (setas, Home, End); a legenda é a versão em texto
 *   dos apontamentos e fica sempre no DOM.
 */
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import type { ConteudoComparador, ConteudoCusto, Pagina } from "@/content/tipos";
import { track } from "@/lib/tracking";
import { CheckIcon, XIcon } from "../icons";
import { CabecalhoSecao, comDestaque } from "../Marcos";

const limitar = (v: number) => Math.min(100, Math.max(0, v));
const REPOUSO = 55;

/** Trajeto do divisor na primeira aparição, a partir do projeto inteiro (100). */
const TRAJETO = [
  { para: 0, ms: 1200 }, // até o fim: a foto inteira
  { para: 0, ms: 250 }, // segura um instante na foto
  { para: REPOUSO, ms: 900 }, // volta para o meio
];
const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function Comparador({ antesDepois }: { antesDepois: ConteudoComparador }) {
  const proporcao = `${antesDepois.imagem.width} / ${antesDepois.imagem.height}`;
  const altura = (100 * antesDepois.imagem.height) / antesDepois.imagem.width; // altura do viewBox das setas
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(100);
  const caixaRef = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);
  const mexeu = useRef(false);
  const usou = useRef(false);

  // A pessoa assumiu o divisor: para a animação e registra o primeiro uso (uma vez por página).
  const assumir = (meio: "arrasto" | "teclado") => {
    mexeu.current = true;
    if (usou.current) return;
    usou.current = true;
    track("comparador_usado", { meio });
  };

  const moverPara = useCallback((clientX: number) => {
    const r = caixaRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos(limitar(((clientX - r.left) / r.width) * 100));
  }, []);

  // Primeira aparição: projeto inteiro → varre até o fim (foto inteira) → volta para o meio.
  useEffect(() => {
    const el = caixaRef.current;
    if (!el) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- posição inicial depende da preferência do sistema
      setPos(REPOUSO);
      return;
    }
    let raf = 0;
    let espera = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        // Dá tempo de ler o projeto e ver as setas se desenharem antes de abrir a foto.
        espera = window.setTimeout(() => {
          if (mexeu.current) return;
          let de = 100;
          let trecho = 0;
          let inicio = performance.now();
          const passo = (t: number) => {
            if (mexeu.current) return; // arrastou ou usou o teclado: a pessoa assume
            const { para, ms } = TRAJETO[trecho];
            const k = Math.min(1, (t - inicio) / ms);
            setPos(de + (para - de) * suave(k));
            if (k < 1) {
              raf = requestAnimationFrame(passo);
              return;
            }
            de = para;
            inicio = t;
            if (++trecho < TRAJETO.length) raf = requestAnimationFrame(passo);
          };
          raf = requestAnimationFrame(passo);
        }, 1000);
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(espera);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <>
        <CabecalhoSecao id="antes-depois-titulo" rotulo={antesDepois.eyebrow} titulo={antesDepois.titulo} intro={antesDepois.intro} layout="lado" />

        <div className="foto mt-12 md:mt-16" data-reveal="foto">
          <div
            ref={caixaRef}
            className="relative w-full touch-pan-y select-none overflow-hidden bg-stage"
            style={{ aspectRatio: proporcao }}
            onPointerDown={(e) => {
              arrastando.current = true;
              assumir("arrasto");
              e.currentTarget.setPointerCapture(e.pointerId);
              moverPara(e.clientX);
            }}
            onPointerMove={(e) => arrastando.current && moverPara(e.clientX)}
            onPointerUp={() => (arrastando.current = false)}
            onPointerCancel={() => (arrastando.current = false)}
          >
            {/* Depois: a foto */}
            <Image
              src={antesDepois.imagem}
              alt={`${antesDepois.alt} Regularizado.`}
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              quality={88}
              placeholder="blur"
              className="pointer-events-none object-cover"
              draggable={false}
            />
            <span className="absolute right-3 top-3 z-10 rounded-full bg-gold px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-stage sm:right-5 sm:top-5 sm:px-4 sm:py-1.5 sm:text-[0.8125rem]">
              {antesDepois.depois.rotulo}
            </span>

            {/* Antes: o projeto, recortado até o divisor */}
            <div className="planta absolute inset-0 z-20" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <Image
                src={antesDepois.planta}
                alt={antesDepois.altPlanta}
                fill
                sizes="(min-width: 1280px) 1200px, 100vw"
                quality={88}
                className="pointer-events-none object-cover"
                draggable={false}
              />
              <div aria-hidden="true" className="planta-grade absolute inset-0" />
              <span className="absolute left-3 top-3 z-10 rounded-full border border-white/40 bg-stage/80 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-white sm:left-5 sm:top-5 sm:px-4 sm:py-1.5 sm:text-[0.8125rem]">
                {antesDepois.antes.rotulo}
              </span>

              {/* Setas: do ponto na casa até a etiqueta */}
              {/* viewBox na proporção da imagem: escala uniforme, traço contínuo (sem vector-effect, que quebra o dash da animação) */}
              <svg aria-hidden="true" className="absolute inset-0 hidden h-full w-full md:block" viewBox={`0 0 100 ${altura}`}>
                {antesDepois.problemas.map((p, i) => (
                  <line
                    key={p.titulo}
                    x1={p.ponto.x}
                    y1={(p.ponto.y * altura) / 100}
                    x2={p.rotulo.x}
                    y2={(p.rotulo.y * altura) / 100}
                    pathLength={1}
                    className="linha-apontamento"
                    style={{ "--i": i } as CSSProperties}
                  />
                ))}
              </svg>

              {antesDepois.problemas.map((p, i) => (
                <div key={p.titulo} aria-hidden="true">
                  <span
                    className="marcador absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-alerta text-[0.75rem] font-semibold text-stage sm:size-7 sm:text-[0.8125rem]"
                    style={{ left: `${p.ponto.x}%`, top: `${p.ponto.y}%`, "--i": i } as CSSProperties}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="etiqueta absolute z-10 hidden max-w-[16rem] -translate-y-full rounded-lg border-l-2 border-alerta bg-stage/90 px-3 py-2 text-white backdrop-blur-sm md:block lg:max-w-[18rem]"
                    style={{ left: `${p.rotulo.x}%`, top: `${p.rotulo.y}%`, "--i": i } as CSSProperties}
                  >
                    <span className="block text-[0.875rem] font-semibold leading-snug">
                      <span className="mr-1.5 text-alerta">{i + 1}.</span>
                      {p.titulo}
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] leading-snug text-white/70">{p.detalhe}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Divisor */}
            <div className="absolute inset-y-0 z-30 w-px bg-gold" style={{ left: `${pos}%` }}>
              <button
                type="button"
                role="slider"
                aria-label="Comparar o projeto com o imóvel regularizado"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
                aria-valuetext={`${Math.round(pos)}% mostrando o projeto`}
                onKeyDown={(e) => {
                  const passos: Record<string, number> = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5 };
                  if (e.key in passos) {
                    e.preventDefault();
                    assumir("teclado");
                    setPos((p) => limitar(p + passos[e.key]));
                  } else if (e.key === "Home" || e.key === "End") {
                    e.preventDefault();
                    assumir("teclado");
                    setPos(e.key === "Home" ? 0 : 100);
                  }
                }}
                className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-4 border-stage/20 bg-gold bg-clip-padding text-stage shadow-[0_8px_30px_rgba(0,26,54,0.45)] focus-visible:outline-offset-4 sm:size-12"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 6 3 12l6 6M15 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Legenda: visível no celular, versão em texto para leitores de tela no desktop */}
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 md:sr-only" data-reveal>
          {antesDepois.problemas.map((p, i) => (
            <li key={p.titulo} className="flex gap-3">
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-alerta text-[0.75rem] font-semibold text-stage"
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold leading-snug">{p.titulo}</span>
                <span className="mt-0.5 block text-[0.9375rem] leading-snug text-muted">{p.detalhe}</span>
              </span>
            </li>
          ))}
        </ol>
    </>
  );
}

/** A frase de fechamento: a segunda oração vem em dourado. */
function Frase({ texto }: { texto: string }) {
  const corte = texto.indexOf(". ");
  const destaque = corte > 0 ? texto.slice(corte + 2) : undefined;
  return (
    <p className="titulo-md mx-auto mt-16 max-w-[26ch] text-center md:mt-20 md:text-[clamp(2rem,1.2rem+2vw,3rem)]" data-reveal>
      {comDestaque(texto, destaque, true)}
    </p>
  );
}

/** Irregular × regularizado, em dois cartões. Cada linha da esquerda tem o seu par na direita. */
function OQueMuda({ custo, nivel }: { custo: ConteudoCusto; nivel: 3 | 4 }) {
  const [ruim, bom] = custo.colunas;
  const Tag = nivel === 3 ? "h3" : "h4";
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      <div className="rounded-[1.5rem] border border-border bg-card p-7 md:p-9" data-reveal>
        <Tag className="flex items-center gap-3 font-display text-[1.5rem] font-semibold uppercase leading-none">
          <span className="grid size-8 place-items-center rounded-full bg-alerta/15 text-alerta-ink" aria-hidden="true">
            <XIcon size={16} />
          </span>
          {ruim}
        </Tag>
        <ul className="mt-6">
          {custo.linhas.map(([r]) => (
            <li key={r} className="flex items-center gap-3 border-t border-border py-3.5 text-muted">
              <XIcon size={15} className="shrink-0 text-alerta-ink" />
              {r}
            </li>
          ))}
        </ul>
      </div>
      <div className="on-stage rounded-[1.5rem] p-7 md:p-9" data-reveal style={{ "--i": 1 } as CSSProperties}>
        <Tag className="flex items-center gap-3 font-display text-[1.5rem] font-semibold uppercase leading-none">
          <span className="grid size-8 place-items-center rounded-full bg-gold text-stage" aria-hidden="true">
            <CheckIcon size={16} />
          </span>
          {bom}
        </Tag>
        <ul className="mt-6">
          {custo.linhas.map(([, b]) => (
            <li key={b} className="flex items-center gap-3 border-t border-border py-3.5">
              <CheckIcon size={15} className="shrink-0 text-gold" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Comparador (se a página tiver) + "o que muda". Sem comparador, o título da seção vem de `custo`. */
export function AntesDepois({ pagina }: { pagina: Pagina }) {
  const { comparador, custo } = pagina;
  return (
    <section aria-labelledby="antes-depois-titulo" data-secao="comparador" className="bg-surface py-24 md:py-32">
      <div className="container-x">
        {comparador ? (
          <>
            <Comparador antesDepois={comparador} />
            {custo.titulo && (
              <CabecalhoSecao
                id="o-que-muda-titulo"
                rotulo={custo.eyebrow ?? ""}
                titulo={custo.titulo}
                nivel={3}
                className="mt-24 md:mt-32"
                tituloClassName="!max-w-[22ch]"
              />
            )}
          </>
        ) : (
          <CabecalhoSecao id="antes-depois-titulo" rotulo={custo.eyebrow ?? ""} titulo={custo.titulo ?? ""} tituloClassName="!max-w-[20ch]" />
        )}

        <div className="mt-10 md:mt-12">
          <OQueMuda custo={custo} nivel={comparador && custo.titulo ? 4 : 3} />
        </div>
        <Frase texto={custo.frase} />
      </div>
    </section>
  );
}
