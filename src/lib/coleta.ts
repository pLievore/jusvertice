/**
 * Classificação de cada evento recebido pelo coletor: aparelho, navegador, sistema e fonte do tráfego.
 * Sem IP guardado (LGPD): a localização é só a cidade que a Vercel informa no cabeçalho.
 */

export function aparelho(ua: string) {
  const dispositivo = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)
    ? "tablet"
    : /Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)
      ? "celular"
      : "computador";

  const sistema = /iPhone|iPad|iPod/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/i.test(ua)
          ? "macOS"
          : /Linux|CrOS/i.test(ua)
            ? "Linux"
            : "outro";

  // Os navegadores internos do Instagram e do Facebook vêm primeiro: dizem de qual app o anúncio foi aberto.
  const navegador = /Instagram/i.test(ua)
    ? "Instagram (app)"
    : /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)
      ? "Facebook (app)"
      : /WhatsApp/i.test(ua)
        ? "WhatsApp (app)"
        : /Edg\//i.test(ua)
          ? "Edge"
          : /SamsungBrowser/i.test(ua)
            ? "Samsung Internet"
            : /OPR\/|Opera/i.test(ua)
              ? "Opera"
              : /Firefox|FxiOS/i.test(ua)
                ? "Firefox"
                : /Chrome|CriOS/i.test(ua)
                  ? "Chrome"
                  : /Safari/i.test(ua)
                    ? "Safari"
                    : "outro";

  return { dispositivo, sistema, navegador };
}

export const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|playwright|puppeteer|preview|facebookexternalhit|vercel-screenshot/i;

const META = /^(facebook|fb|instagram|ig|meta|an|msg|audience_network|messenger|threads)$/i;

/**
 * Fonte do tráfego, na ordem: anúncio da Meta, Google Ads, outra campanha com utm_source,
 * e, sem parâmetro, a página de onde a pessoa veio.
 */
export function fonte(attr: { utm_source?: string; fbclid?: string; gclid?: string }, referencia?: string) {
  if (attr.utm_source && META.test(attr.utm_source)) return "Meta Ads";
  if (attr.fbclid) return "Meta Ads";
  if (attr.gclid || /^(google|adwords|gads)$/i.test(attr.utm_source ?? "")) return "Google Ads";
  if (attr.utm_source) return attr.utm_source.slice(0, 40);
  if (!referencia) return "Direto";
  if (/google\.|bing\.|duckduckgo|yahoo\.|ecosia/i.test(referencia)) return "Busca orgânica";
  if (/instagram|facebook|fb\.|threads\./i.test(referencia)) return "Instagram/Facebook orgânico";
  if (/whatsapp|wa\.me/i.test(referencia)) return "WhatsApp";
  return "Outros sites";
}

/** Cabeçalhos de geolocalização da Vercel (cidade vem codificada). */
export function local(headers: Headers) {
  const decod = (v: string | null) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v).slice(0, 80);
    } catch {
      return v.slice(0, 80);
    }
  };
  return {
    cidade: decod(headers.get("x-vercel-ip-city")),
    estado: decod(headers.get("x-vercel-ip-country-region")),
    pais: decod(headers.get("x-vercel-ip-country")),
  };
}
