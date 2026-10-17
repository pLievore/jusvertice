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
import { faq, microcopyDiagnostico, perguntaDiagnostico } from "@/content/site";

export default function Home() {
  const extra = perguntaDiagnostico();
  const faqItens = extra ? [...faq.itens.slice(0, 1), extra, ...faq.itens.slice(1)] : faq.itens;

  return (
    <>
        <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="outline-none">
          <Hero />
          <Checklist microcopy={microcopyDiagnostico()} />
          <AntesDepois />
        <Diferencial />
          <Situacoes />
          <ComoFunciona />
        <Capacidades />
          <Faq itens={faqItens} />
          <CtaFinal />
      </main>
      <SiteFooter />
        <StickyCta />
        <PageEffects />
      <JsonLd faq={faqItens} />
    </>
  );
}
