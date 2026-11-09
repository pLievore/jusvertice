import { JsonLd } from "@/components/JsonLd";
import { PageEffects } from "@/components/PageEffects";
import { AntesDepois } from "@/components/sections/AntesDepois";
import { Capacidades } from "@/components/sections/Capacidades";
import { Checklist } from "@/components/sections/Checklist";
import { ComoFunciona } from "@/components/sections/ComoFunciona";
import { CtaFinal } from "@/components/sections/CtaFinal";
import { Diferencial } from "@/components/sections/Diferencial";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Situacoes } from "@/components/sections/Situacoes";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyCta } from "@/components/StickyCta";
import { microcopyDiagnostico, perguntaDiagnostico } from "@/content/site";
import type { Pagina } from "@/content/tipos";

/** Monta uma landing inteira a partir do conteúdo. As duas páginas do site usam este mesmo esqueleto. */
export function PaginaLanding({ pagina }: { pagina: Pagina }) {
  const extra = perguntaDiagnostico();
  const faqItens = extra ? [...pagina.faq.itens.slice(0, 1), extra, ...pagina.faq.itens.slice(1)] : pagina.faq.itens;

  return (
    <>
      <SiteHeader origem={pagina.origens.cabecalho} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero pagina={pagina} />
        <Checklist pagina={pagina} microcopy={microcopyDiagnostico()} />
        <AntesDepois pagina={pagina} />
        <Diferencial pagina={pagina} />
        <Situacoes pagina={pagina} />
        <ComoFunciona pagina={pagina} />
        <Capacidades pagina={pagina} />
        <Faq pagina={pagina} itens={faqItens} />
        <CtaFinal pagina={pagina} />
      </main>
      <SiteFooter origem={pagina.origens.rodape} />
      <StickyCta origem={pagina.origens.barraFixa} texto={pagina.hero.ctaBarra} />
      <PageEffects />
      <JsonLd faq={faqItens} />
    </>
  );
}
