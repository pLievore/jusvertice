import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Pagina } from "@/content/tipos";
import { ArrowRight } from "../icons";
import { CabecalhoSecao, Vertice } from "../Marcos";

/** O que a empresa faz: três frentes, cada uma com foto em arco e os trabalhos que entrega. */
export function Servicos({ pagina }: { pagina: Pagina }) {
  const servicos = pagina.capacidades;
  return (
    <section id="servicos" aria-labelledby="servicos-titulo" data-secao="servicos" className="py-24 md:py-32">
      <div className="container-x">
        <CabecalhoSecao id="servicos-titulo" rotulo={servicos.eyebrow} titulo={servicos.titulo} intro={servicos.intro} layout="lado" />

        <ul className="mt-14 grid gap-14 md:mt-20 md:grid-cols-3 md:gap-8 lg:gap-12">
          {servicos.itens.map((item, i) => (
            <li key={item.titulo} className="group flex flex-col">
              <div className="foto-arco relative aspect-[4/5] bg-stage" data-reveal="foto" style={{ "--i": i } as CSSProperties}>
                <Image
                  src={item.imagem}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1280px) 380px, (min-width: 768px) 30vw, 100vw"
                  quality={88}
                  placeholder="blur"
                  className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-editorial)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col" data-reveal style={{ "--i": i } as CSSProperties}>
                <h3 className="titulo-md mt-7 md:flex md:min-h-[2em] md:items-end">{item.titulo}</h3>
                <p className="mt-3 text-muted">{item.texto}</p>
                <ul className="mt-5 border-t border-border">
                  {item.topicos.map((t) => (
                    <li key={t} className="flex items-center gap-3 border-b border-border py-2.5 text-[0.9688rem] font-medium">
                      <Vertice size={12} className="text-gold-ink" />
                      {t}
                    </li>
                  ))}
                </ul>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="link-quiet mt-4 self-start"
                    data-track="navegacao_click"
                    data-track-destino={item.link.href}
                  >
                    {item.link.texto}
                    <ArrowRight size={17} className="seta" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
