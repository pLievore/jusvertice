import type { CSSProperties, ReactNode } from "react";

/**
 * Peças da identidade da marca, usadas por todas as seções.
 *
 * - Vertice: o marco de um levantamento (anel com ponto), o "Vértice" do nome.
 * - Arco: o arco dourado grosso dos posts.
 * - CabecalhoSecao: rótulo com marco + linha tracejada, título em caixa alta e introdução.
 */

export function Vertice({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="1.9" fill="currentColor" />
    </svg>
  );
}

/** Arco dourado: um quarto de anel. Decorativo, sempre atrás do conteúdo. */
export function Arco({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none ${className}`} style={style} aria-hidden="true" focusable="false">
      <path d="M12 200A188 188 0 0 1 200 12" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="butt" />
    </svg>
  );
}

/** Pinta de dourado o trecho `destaque` do texto. Com `quebra`, o trecho começa numa linha nova. */
export function comDestaque(texto: string, destaque?: string, quebra = false): ReactNode {
  const i = destaque ? texto.lastIndexOf(destaque) : -1;
  if (!destaque || i < 0) return texto;
  const antes = texto.slice(0, i).trimEnd();
  return (
    <>
      {antes}
      {antes && " "}
      <span className={`destaque ${quebra ? "block" : ""}`}>{texto.slice(i)}</span>
    </>
  );
}

export function Rotulo({ children, className = "", reveal = true }: { children: ReactNode; className?: string; reveal?: boolean }) {
  return (
    <p className={`rotulo ${className}`} data-reveal={reveal ? "" : undefined}>
      <Vertice size={13} />
      {children}
    </p>
  );
}

type Props = {
  id: string;
  rotulo: string;
  titulo: string;
  intro?: ReactNode;
  /** "lado": título à esquerda e introdução à direita, alinhados pela base (desktop). */
  layout?: "pilha" | "lado";
  /** Nível do título: h2 por padrão; h3 quando é um bloco dentro de outra seção. */
  nivel?: 2 | 3;
  className?: string;
  tituloClassName?: string;
};

export function CabecalhoSecao({ id, rotulo, titulo, intro, layout = "pilha", nivel = 2, className = "", tituloClassName = "" }: Props) {
  const Tag = nivel === 2 ? "h2" : "h3";
  const titulo_ = (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <Tag
        id={id}
        className={`${nivel === 2 ? "titulo" : "titulo-md"} mt-5 max-w-[17ch] ${tituloClassName}`}
        data-reveal
        style={{ "--i": 1 } as CSSProperties}
      >
        {titulo}
      </Tag>
    </div>
  );
  const intro_ = intro && (
    <p className="max-w-[32rem] text-muted md:text-lg" data-reveal style={{ "--i": 2 } as CSSProperties}>
      {intro}
    </p>
  );
  if (layout === "lado") {
    return (
      <div className={`grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16 ${className}`}>
        {titulo_}
        {intro_}
      </div>
    );
  }
  return (
    <div className={className}>
      {titulo_}
      {intro_ && <div className="mt-6">{intro_}</div>}
    </div>
  );
}
