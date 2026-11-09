"use client";

/**
 * Hero em palco escuro, mídia em tela cheia, copy ancorada embaixo à esquerda.
 *
 * Três modos, escolhidos sozinhos conforme a mídia disponível (src/content/hero-midia.json,
 * gerado por scripts/montar-hero.mjs a partir do vídeo do Veo 3):
 *  - Desktop com quadros: sequência WebP em canvas, scrubbing pela rolagem (seção de 240vh,
 *    palco fixo). Seek de <video> por scroll engasga, sobretudo no iOS; canvas não.
 *  - Celular com vídeo: faixa 16:9 no topo com o vídeo INTEIRO e o texto abaixo, no palco.
 *    Recortar o 16:9 em retrato deixava 540 px esticados 3× (borrado) e mostrava só um pedaço
 *    da casa. Toca uma vez e para com a casa acesa (ou em loop, se for boomerang). Scrubbing no
 *    telefone vira parede (o polegar rola e a página não sai do lugar).
 *  - Sem vídeo ainda / movimento reduzido: poster com movimento de câmera leve pela rolagem
 *    (reduzido: parado).
 *
 * O título entra palavra a palavra em CSS puro, começando em opacidade 0.01: não depende
 * de JS e o navegador já conta o título como LCP na primeira pintura.
 */
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import Image, { getImageProps } from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import heroMidia from "@/content/hero-midia.json";
import { microcopyDiagnostico, midia } from "@/content/site";
import type { Pagina } from "@/content/tipos";
import { WhatsAppLink } from "../WhatsAppLink";

const QUADROS = heroMidia.quadros;
const PASSADAS = [12, 6, 3, 2, 1] as const; // cobertura antes de densidade
const CONCORRENCIA = 8;

function useCelular() {
  const [celular, setCelular] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const atualizar = () => setCelular(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);
  return celular;
}

function Poster({ final = false, alt }: { final?: boolean; alt: string }) {
  return (
    <Image
      src={final ? midia.heroPosterFinal : midia.heroPoster}
      alt={alt}
      fill
      priority
      sizes="100vw"
      quality={88}
      className="object-cover"
    />
  );
}

/** URL otimizada do primeiro quadro, para o atributo poster do <video>. */
const posterVideo = getImageProps({ src: midia.heroPoster, alt: "", width: heroMidia.largura, quality: 88 }).props.src;

export function Hero({ pagina }: { pagina: Pagina }) {
  const hero = pagina.hero;
  const reduce = useReducedMotion();
  const celular = useCelular();
  const scrubbing = !reduce && celular === false && QUADROS > 0;
  const videoNoCelular = !reduce && celular === true && heroMidia.videoMobile;

  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quadrosProntos, setQuadrosProntos] = useState(false);

  // Scrubbing: progresso ao longo dos 240vh. Poster: progresso enquanto o hero sai da tela.
  const { scrollYProgress: pinado } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: saindo } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Mola superamortecida: soltar o dedo desacelera em vez de congelar, sem quicar.
  const progresso = useSpring(pinado, { stiffness: 26, damping: 16, mass: 1.1, restDelta: 0.0002 });

  const escala = useTransform(saindo, [0, 1], [1.04, 1.18]);
  const deslocamento = useTransform(saindo, [0, 1], ["0%", "8%"]);
  const copyY = useTransform(scrubbing ? progresso : saindo, [0, 1], ["0%", scrubbing ? "-18%" : "-30%"]);
  const copyOpacidade = useTransform(scrubbing ? progresso : saindo, scrubbing ? [0.55, 0.82] : [0.15, 0.6], [1, 0]);
  const indicador = useTransform(saindo, [0, 0.06], [1, 0]);

  // ── Sequência de quadros (só desktop) ─────────────────────────────────────
  useEffect(() => {
    if (!scrubbing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    let cancelado = false;
    const imagens: (HTMLImageElement | undefined)[] = new Array(QUADROS);
    let ultimo = -1;

    const maisProximo = (i: number) => {
      if (imagens[i]) return imagens[i];
      for (let d = 1; d < QUADROS; d++) {
        if (imagens[i - d]) return imagens[i - d];
        if (imagens[i + d]) return imagens[i + d];
      }
    };

    const desenhar = (forcar = false) => {
      const i = Math.round(progresso.get() * (QUADROS - 1));
      if (!forcar && i === ultimo) return;
      const img = maisProximo(i);
      if (!img) return;
      ultimo = i;
      const { width: cw, height: ch } = canvas;
      const escalaImg = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * escalaImg;
      const h = img.naturalHeight * escalaImg;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const dimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      desenhar(true);
    };

    const carregar = async (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = midia.heroQuadros(i);
      try {
        await img.decode(); // decodifica fora do scroll: o draw vira só um blit
      } catch {
        return;
      }
      if (cancelado) return;
      imagens[i] = img;
      if (i === Math.round(progresso.get() * (QUADROS - 1))) desenhar(true);
    };

    const lote = async (indices: number[]) => {
      const fila = indices.filter((i) => !imagens[i]);
      await Promise.all(
        Array.from({ length: CONCORRENCIA }, async () => {
          while (fila.length && !cancelado) await carregar(fila.shift()!);
        }),
      );
    };

    (async () => {
      await lote([0, 1, 2, 3]);
      if (cancelado) return;
      dimensionar();
      setQuadrosProntos(true);
      for (const passo of PASSADAS) {
        if (cancelado) return;
        const indices: number[] = [];
        for (let i = 0; i < QUADROS; i += passo) indices.push(i);
        await lote(indices);
      }
    })();

    const off = progresso.on("change", () => desenhar());
    window.addEventListener("resize", dimensionar);
    return () => {
      cancelado = true;
      off();
      window.removeEventListener("resize", dimensionar);
    };
  }, [scrubbing, progresso]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-titulo"
      data-stage-hero=""
      // Altura do scrubbing já no CSS do servidor: se dependesse do JS, o useScroll mediria uma
      // seção curta na montagem, travaria o progresso em 100% e a página abriria no último quadro.
      className={`on-stage relative ${QUADROS > 0 ? "md:motion-safe:h-[240vh]" : ""}`}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden md:min-h-[100svh] md:justify-end ${QUADROS > 0 ? "md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-screen" : ""}`}
      >
        {/* Mídia: faixa 16:9 no celular, tela cheia no desktop */}
        <div className="relative mt-[4.5rem] aspect-video w-full md:absolute md:inset-0 md:mt-0 md:aspect-auto">
          {videoNoCelular ? (
            <video
              className="h-full w-full object-cover"
              poster={posterVideo}
              src={midia.heroVideoMobile}
              autoPlay
              loop={heroMidia.loopMobile}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          ) : (
            <motion.div
              className="absolute inset-0 will-change-transform"
              style={reduce || scrubbing ? undefined : { scale: escala, y: deslocamento }}
            >
              <Poster final={!!reduce && QUADROS > 0} alt={hero.posterAlt} />
            </motion.div>
          )}
          {scrubbing && (
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${quadrosProntos ? "opacity-100" : "opacity-0"}`}
            />
          )}

          {/* Celular: a faixa só funde com o palco embaixo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-stage to-transparent md:hidden"
          />

          {/* Sombra de base: o texto sempre assenta no escuro */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to top, rgba(7,20,41,0.97) 0%, rgba(7,20,41,0.85) 28%, rgba(7,20,41,0.45) 55%, rgba(7,20,41,0.1) 78%, transparent 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{ background: "radial-gradient(125% 105% at 50% 40%, transparent 45%, rgba(7,20,41,0.6) 100%)" }}
          />
          {/* Sombra local atrás da copy: protege o texto sem escurecer a imagem inteira */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{ background: "radial-gradient(70% 62% at 24% 78%, rgba(7,20,41,0.7) 0%, rgba(7,20,41,0.4) 45%, transparent 78%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 md:block"
            style={{ background: "linear-gradient(to bottom, rgba(7,20,41,0.7), transparent)" }}
          />
        </div>

        {/* Copy */}
        <motion.div
          className="relative z-10 pb-12 pt-6 will-change-transform md:pb-20 md:pt-28"
          style={reduce ? undefined : { y: copyY, opacity: copyOpacidade }}
        >
          <div className="container-x">
            <p className="eyebrow entrar" style={{ "--d": 0 } as CSSProperties}>
              {hero.eyebrow}
            </p>
            <h1
              id="hero-titulo"
              className="display entrar-titulo mt-4 max-w-[13ch] text-[clamp(2.5rem,1.1rem+7.2vw,7.5rem)]"
              style={{ textShadow: "0 1px 28px rgba(7,20,41,0.65)", "--d": 90 } as CSSProperties}
            >
              {hero.titulo}
            </h1>
            <p
              className="entrar mt-6 max-w-[34rem] text-[1.0625rem] leading-relaxed text-stage-muted md:text-lg"
              style={{ "--d": 260 } as CSSProperties}
            >
              {hero.subtitulo}
            </p>
            <div className="entrar mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ "--d": 380 } as CSSProperties}>
              <WhatsAppLink id="cta-topo" origem={pagina.origens.topo} arrow className="btn btn-primary">
                {hero.cta}
              </WhatsAppLink>
              <a href="#checklist" className="btn btn-ghost">
                {hero.ctaSecundario}
              </a>
            </div>
            <p className="entrar meta mt-4" style={{ "--d": 460 } as CSSProperties}>
              {microcopyDiagnostico()}
            </p>
          </div>
        </motion.div>

        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="absolute bottom-6 right-[var(--gutter)] z-10 hidden md:block"
            style={{ opacity: indicador }}
          >
            <span className="pulso-rolagem block h-10 w-px bg-gold" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
