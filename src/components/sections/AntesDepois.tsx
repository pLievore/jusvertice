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
 * - Primeira aparição: abre mostrando o projeto inteiro e desliza até o meio, revelando a foto.
 *   Movimento reduzido: já começa no meio, sem animação.
 * - Acessível: o divisor é um `role="slider"` (setas, Home, End); a legenda é a versão em texto
 *   dos apontamentos e fica sempre no DOM.
 */
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { antesDepois, custo, midia } from "@/content/site";

const limitar = (v: number) => Math.min(100, Math.max(0, v));
const REPOUSO = 55;
const proporcao = `${midia.antesDepois.width} / ${midia.antesDepois.height}`;
const altura = (100 * midia.antesDepois.height) / midia.antesDepois.width; // altura do viewBox das setas

export function AntesDepois() {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(100);
  const caixaRef = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);
  const mexeu = useRef(false);

  const moverPara = useCallback((clientX: number) => {
    const r = caixaRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos(limitar(((clientX - r.left) / r.width) * 100));
  }, []);

  // Primeira aparição: projeto inteiro → desliza até o repouso, revelando a foto.
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
          const inicio = performance.now();
          const passo = (t: number) => {
            if (mexeu.current) return;
            const k = Math.min(1, (t - inicio) / 1600);
            const ease = 1 - Math.pow(1 - k, 4);
            setPos(100 + (REPOUSO - 100) * ease);
            if (k < 1) raf = requestAnimationFrame(passo);
          };
          raf = requestAnimationFrame(passo);
        }, 1400);
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
    <section aria-labelledby="antes-depois-titulo" className="border-y border-border bg-surface py-24 md:py-36">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow" data-reveal>
              {antesDepois.eyebrow}
            </p>
            <h2 id="antes-depois-titulo" className="titulo mt-5 max-w-[18ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
              {antesDepois.titulo}
            </h2>
          </div>
          <p className="max-w-[26rem] text-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
            {antesDepois.intro}
          </p>
        </div>

        <div className="mt-12" data-reveal="foto">
          <div
            ref={caixaRef}
            className="relative w-full touch-pan-y select-none overflow-hidden bg-stage"
            style={{ aspectRatio: proporcao }}
            onPointerDown={(e) => {
              arrastando.current = true;
              mexeu.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              moverPara(e.clientX);
            }}
            onPointerMove={(e) => arrastando.current && moverPara(e.clientX)}
            onPointerUp={() => (arrastando.current = false)}
            onPointerCancel={() => (arrastando.current = false)}
          >
            {/* Depois: a foto */}
            <Image
              src={midia.antesDepois}
              alt={`${antesDepois.alt} Regularizado.`}
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              quality={88}
              placeholder="blur"
              className="pointer-events-none object-cover"
              draggable={false}
            />
            <span className="absolute right-3 top-3 z-10 bg-gold px-2.5 py-1 text-[0.75rem] font-medium text-stage sm:right-5 sm:top-5 sm:px-3 sm:py-1.5 sm:text-[0.8125rem]">
              {antesDepois.depois.rotulo}
            </span>

            {/* Antes: o projeto, recortado até o divisor */}
            <div className="planta absolute inset-0 z-20" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <Image
                src={midia.antesDepoisPlanta}
                alt={antesDepois.altPlanta}
                fill
                sizes="(min-width: 1280px) 1200px, 100vw"
                quality={88}
                className="pointer-events-none object-cover"
                draggable={false}
              />
              <div aria-hidden="true" className="planta-grade absolute inset-0" />
              <span className="absolute left-3 top-3 z-10 border border-white/40 bg-[#0d2a4f]/80 px-2.5 py-1 text-[0.75rem] text-white sm:left-5 sm:top-5 sm:px-3 sm:py-1.5 sm:text-[0.8125rem]">
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
                    className="marcador absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#e88e6f] text-[0.75rem] font-semibold text-stage sm:size-7 sm:text-[0.8125rem]"
                    style={{ left: `${p.ponto.x}%`, top: `${p.ponto.y}%`, "--i": i } as CSSProperties}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="etiqueta absolute z-10 hidden max-w-[16rem] -translate-y-full border-b border-[#e88e6f] bg-[#0d2a4f]/90 px-3 py-2 text-white backdrop-blur-sm md:block lg:max-w-[18rem]"
                    style={{ left: `${p.rotulo.x}%`, top: `${p.rotulo.y}%`, "--i": i } as CSSProperties}
                  >
                    <span className="block text-[0.875rem] font-medium leading-snug">
                      <span className="mr-1.5 text-[#e88e6f]">{i + 1}.</span>
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
                    mexeu.current = true;
                    setPos((p) => limitar(p + passos[e.key]));
                  } else if (e.key === "Home" || e.key === "End") {
                    e.preventDefault();
                    mexeu.current = true;
                    setPos(e.key === "Home" ? 0 : 100);
                  }
                }}
                className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-gold text-stage shadow-[0_8px_30px_rgba(7,20,41,0.45)] focus-visible:outline-offset-4 sm:size-12"
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
                className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e88e6f] text-[0.75rem] font-semibold text-stage"
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-medium leading-snug">{p.titulo}</span>
                <span className="mt-0.5 block text-[0.9375rem] leading-snug text-muted">{p.detalhe}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* O que muda, nas palavras da cliente */}
        <div className="mt-16 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
          <table className="w-full table-fixed border-collapse text-left" data-reveal>
            <caption className="sr-only">O que muda entre um imóvel irregular e um imóvel regularizado</caption>
            <thead>
              <tr>
                <th scope="col" className="meta pb-4 font-normal">
                  {custo.colunas[0]}
                </th>
                <th scope="col" className="pb-4 text-[0.8125rem] font-medium tracking-[0.02em]">
                  {custo.colunas[1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {custo.linhas.map(([ruim, bom]) => (
                <tr key={ruim} className="border-t border-border">
                  <td className="py-4 pr-4 align-top text-muted line-through decoration-[#a4442a]/40 decoration-1">{ruim}</td>
                  <td className="py-4 align-top">{bom}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] italic leading-[1.05] tracking-[-0.02em] lg:self-end" data-reveal>
            {custo.frase}
          </p>
        </div>
      </div>
    </section>
  );
}
