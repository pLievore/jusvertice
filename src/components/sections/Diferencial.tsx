import Image from "next/image";
import type { CSSProperties } from "react";
import fotoEquipe from "@/assets/equipe.jpg";
import type { Pagina } from "@/content/tipos";
import { Arco, CabecalhoSecao } from "../Marcos";

/** Quem cuida do caso: as duas frentes (engenharia e jurídica) e as duas pessoas por trás delas. */
export function Diferencial({ pagina }: { pagina: Pagina }) {
  const diferencial = pagina.diferencial;
  return (
    <section aria-labelledby="diferencial-titulo" className="on-stage relative overflow-hidden py-24 md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
        <div>
          <CabecalhoSecao id="diferencial-titulo" rotulo={diferencial.eyebrow} titulo={diferencial.titulo} tituloClassName="!max-w-[14ch]" />
          <div className="mt-8 max-w-[34rem] space-y-5 text-stage-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
            {diferencial.paragrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <figure className="relative">
          {/* Arco dourado atrás da foto, saindo pelo canto */}
          <Arco className="absolute -right-10 -top-12 w-40 text-gold md:-right-16 md:-top-16 md:w-56" />
          <div className="foto relative bg-stage-2" data-reveal="foto">
            <Image
              src={fotoEquipe}
              alt={diferencial.fotoAlt}
              placeholder="blur"
              sizes="(min-width: 1280px) 680px, (min-width: 1024px) 54vw, 100vw"
              quality={88}
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-6 grid grid-cols-2 gap-6" data-reveal>
            {diferencial.pessoas.map((p) => (
              <span key={p.nome} className="border-t-2 border-gold pt-4">
                <span className="block font-display text-[1.4rem] font-semibold uppercase leading-tight md:text-[1.6rem]">{p.nome}</span>
                <span className="mt-1.5 block text-[0.9375rem] leading-snug text-stage-muted">{p.papel}</span>
              </span>
            ))}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
