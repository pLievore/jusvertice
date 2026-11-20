"use client";

/**
 * Situações que atendemos — carrossel fixado e girado pela rolagem (desktop),
 * mesma mecânica da EthosBand do Andre-Watch: cada situação entra pela direita,
 * fica em foco no centro e sai pela esquerda. A última segura até a seção liberar.
 *
 * Celular e movimento reduzido: pilha simples com revelação. Fixar 4 telas no
 * telefone vira parede — o polegar rola e a página não anda.
 */
import { cubicBezier, motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { ConteudoSituacoes, Pagina } from "@/content/tipos";
import { Rotulo, Vertice } from "../Marcos";
import { WhatsAppLink } from "../WhatsAppLink";

type Item = ConteudoSituacoes["itens"][number];

const TELA_POR_ITEM_VH = 90;
const CHEGA = cubicBezier(0.22, 1, 0.36, 1);
const SAI = cubicBezier(0.5, 0, 0.75, 0);

function Conteudo({ item, cta }: { item: Item; cta: string }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-16">
      <div className="foto relative aspect-[16/10] w-full bg-stage">
        <Image
          src={item.imagem}
          alt={item.alt}
          fill
          sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw"
          quality={88}
          placeholder="blur"
          className="object-cover"
          draggable={false}
        />
      </div>
      <div className="flex flex-col items-start gap-5">
        <h3 className="titulo text-[clamp(2rem,1.3rem+2.4vw,3.25rem)]">{item.titulo}</h3>
        <p className="max-w-md text-muted md:text-lg">{item.texto}</p>
        <WhatsAppLink origem={item.origem} arrow className="btn btn-ghost mt-2">
          {cta}
        </WhatsAppLink>
      </div>
    </div>
  );
}

function Slide({
  item,
  i,
  total,
  progresso,
  aoFocar,
  cta,
}: {
  item: Item;
  i: number;
  total: number;
  progresso: MotionValue<number>;
  aoFocar: () => void;
  cta: string;
}) {
  const seg = 1 / total;
  const centro = (i + 0.5) * seg;
  const span = seg * 0.7;
  const ultimo = i === total - 1;
  const primeiro = i === 0;
  // Offsets precisam ficar em [0, 1]: o Motion acelera via timeline de rolagem nativa (WAAPI).
  const pontos = [Math.max(0, centro - span), centro, Math.min(1, centro + span)];
  const opts = { ease: [CHEGA, SAI] };
  const x = useTransform(progresso, pontos, [primeiro ? "0%" : "60%", "0%", ultimo ? "0%" : "-60%"], opts);
  const scale = useTransform(progresso, pontos, [primeiro ? 1 : 0.6, 1, ultimo ? 1 : 0.6], opts);
  const opacity = useTransform(progresso, pontos, [primeiro ? 1 : 0, 1, ultimo ? 1 : 0], opts);
  return (
    <motion.div
      style={{ x, scale, opacity }}
      onFocusCapture={aoFocar}
      className="absolute inset-0 flex items-center px-[var(--gutter)] will-change-transform"
    >
      <Conteudo item={item} cta={cta} />
    </motion.div>
  );
}

/** Progresso como uma poligonal: um marco por situação, ligados por tracejado. */
function Marco({ i, total, progresso }: { i: number; total: number; progresso: MotionValue<number> }) {
  const seg = 1 / total;
  const c = (i + 0.5) * seg;
  const pontos = [Math.max(0, c - seg / 2), c, Math.min(1, c + seg / 2)];
  const opacity = useTransform(progresso, pontos, [0.35, 1, 0.35]);
  const scale = useTransform(progresso, pontos, [0.8, 1.15, 0.8]);
  return (
    <motion.span className="block text-gold-ink" style={{ opacity, scale }}>
      <Vertice size={16} />
    </motion.span>
  );
}

function Cabecalho({ situacoes }: { situacoes: ConteudoSituacoes }) {
  return (
    <div>
      <Rotulo reveal={false}>{situacoes.eyebrow}</Rotulo>
      <h2 id="situacoes-titulo" className="titulo mt-5">
        {situacoes.titulo}
      </h2>
    </div>
  );
}

export function Situacoes({ pagina }: { pagina: Pagina }) {
  const situacoes = pagina.situacoes;
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const total = situacoes.itens.length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const atualizar = () => setDesktop(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);

  // Teclado: focar um link de um slide leva a rolagem até ele ficar em foco na tela.
  const irPara = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const alvo = el.offsetTop + ((i + 0.5) / total) * (el.offsetHeight - window.innerHeight);
    if (Math.abs(window.scrollY - alvo) > 4) window.scrollTo({ top: alvo, behavior: "instant" });
  };

  if (reduce || !desktop) {
    return (
      <section ref={ref} aria-labelledby="situacoes-titulo" data-secao="situacoes" className="py-24">
        <div className="container-x">
          <div data-reveal>
            <Cabecalho situacoes={situacoes} />
          </div>
          <ul className="mt-14 grid gap-16">
            {situacoes.itens.map((item) => (
              <li key={item.origem} data-reveal style={{ "--i": 0 } as CSSProperties}>
                <Conteudo item={item} cta={situacoes.cta} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      aria-labelledby="situacoes-titulo"
      data-secao="situacoes"
      className="relative"
      style={{ height: `${total * TELA_POR_ITEM_VH + 40}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-28">
        <div className="container-x flex items-end justify-between gap-8">
          <Cabecalho situacoes={situacoes} />
          <div aria-hidden="true" className="relative flex items-center gap-5 pb-4">
            <span className="tracejado absolute inset-x-2 top-[calc(50%_-_0.5rem)] h-px text-border" />
            {situacoes.itens.map((item, i) => (
              <span key={item.origem} className="relative bg-background">
                <Marco i={i} total={total} progresso={scrollYProgress} />
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex-1">
          {situacoes.itens.map((item, i) => (
            <Slide key={item.origem} item={item} i={i} total={total} progresso={scrollYProgress} aoFocar={() => irPara(i)} cta={situacoes.cta} />
          ))}
        </div>
      </div>
    </section>
  );
}
