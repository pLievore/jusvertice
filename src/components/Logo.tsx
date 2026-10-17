/**
 * Monograma JV redesenhado em SVG a partir dos posts (o arquivo vetorial original ainda não foi enviado).
 * `palco`: J dourado e V prateado, como no material da marca.
 * `papel`: ouro mais escuro e V em tinta, para não sumir no fundo claro.
 */
type Variante = "palco" | "papel";

export function Monogram({
  id,
  className,
  variante = "palco",
}: {
  id: string;
  className?: string;
  variante?: Variante;
}) {
  const gold = `${id}-gold`;
  const silver = `${id}-silver`;
  const clip = `${id}-clip`;
  const papel = variante === "papel";
  return (
    <svg viewBox="0 0 200 210" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={papel ? "#C9A45C" : "#F6E6B4"} />
          <stop offset="0.5" stopColor={papel ? "#A07E3C" : "#D6B26A"} />
          <stop offset="1" stopColor={papel ? "#7A5C22" : "#9E7A35"} />
        </linearGradient>
        <linearGradient id={silver} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={papel ? "#3A4A66" : "#FFFFFF"} />
          <stop offset="0.5" stopColor={papel ? "#1B2A45" : "#CDD2DA"} />
          <stop offset="1" stopColor={papel ? "#0E1A2E" : "#7E8794"} />
        </linearGradient>
        <clipPath id={clip}>
          <path d="M0 0H200V82L125 200L76 90H0Z" />
        </clipPath>
      </defs>
      <path
        fill={`url(#${gold})`}
        d="M12 52H84V58.5H67.5V158C67.5 182 52 198 30 198C17 198 7 192 2.5 183L8.5 179C13 186 20.5 190.5 29.5 190.5C41.5 190.5 49 180 49 160V58.5H12Z"
      />
      <path fill={`url(#${gold})`} d="M87 45 96.5 38.5V100H87Z" />
      <g clipPath={`url(#${clip})`} fill={`url(#${silver})`}>
        <path d="M103.5 16 116 7.5V180H103.5Z" />
        <path d="M120 31 131 24V180H120Z" />
        <path d="M135 47 145 41V180H135Z" />
      </g>
      <path fill={`url(#${silver})`} d="M76 90H101L125 156 172 82H198L125 200Z" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[1.0625rem] tracking-[0.01em] ${className}`}>
      Jus<span aria-hidden="true" className="opacity-70">·</span>Vértice
    </span>
  );
}
