import Image from "next/image";
import type { CSSProperties } from "react";
import fotoEquipe from "@/assets/equipe.jpg";
import { diferencial } from "@/content/site";

export function Diferencial() {
  return (
    <section aria-labelledby="diferencial-titulo" className="py-24 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-20">
        <div>
          <p className="eyebrow" data-reveal>
            {diferencial.eyebrow}
          </p>
          <h2 id="diferencial-titulo" className="titulo mt-5 max-w-[12ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
            {diferencial.titulo}
          </h2>
          <div className="mt-8 max-w-[34rem] space-y-5 text-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
            {diferencial.paragrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <figure>
          <div className="relative overflow-hidden bg-stage" data-reveal="foto">
            <Image
              src={fotoEquipe}
              alt={diferencial.fotoAlt}
              placeholder="blur"
              sizes="(min-width: 1280px) 660px, (min-width: 1024px) 52vw, 100vw"
              quality={88}
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-5 grid grid-cols-2 gap-6 border-t border-border pt-5" data-reveal>
            {diferencial.pessoas.map((p) => (
              <span key={p.nome}>
                <span className="block font-display text-[1.25rem] leading-tight">{p.nome}</span>
                <span className="meta mt-1 block">{p.papel}</span>
              </span>
            ))}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
