import Image from "next/image";
import type { CSSProperties } from "react";
import type { Pagina } from "@/content/tipos";

export function Capacidades({ pagina }: { pagina: Pagina }) {
  const capacidades = pagina.capacidades;
  return (
    <section aria-labelledby="capacidades-titulo" className="py-24 md:py-36">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-24">
          <div>
            <p className="eyebrow" data-reveal>
              {capacidades.eyebrow}
            </p>
            <h2 id="capacidades-titulo" className="titulo mt-5 max-w-[14ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
              {capacidades.titulo}
            </h2>
          </div>
          <blockquote className="border-l border-gold pl-6 font-display text-[1.35rem] italic leading-snug text-muted md:text-[1.6rem]" data-reveal>
            “{capacidades.citacao}”
          </blockquote>
        </div>

        <ul className="mt-16 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-8">
          {capacidades.itens.map((item, i) => (
            <li key={item.titulo} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-stage md:aspect-[2/3]" data-reveal="foto" style={{ "--i": i } as CSSProperties}>
                <Image
                  src={item.imagem}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 30vw, 100vw"
                  quality={88}
                  className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
                />
              </div>
              <div data-reveal style={{ "--i": i } as CSSProperties}>
                <span className="meta mt-6 block">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-[1.75rem] leading-tight">{item.titulo}</h3>
                <p className="mt-3 max-w-[24rem] text-muted">{item.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
