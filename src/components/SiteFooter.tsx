import { empresa } from "@/content/site";
import { Monogram, Wordmark } from "./Logo";

async function anoAtual() {
  "use cache";
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const ano = await anoAtual();
  return (
    <footer className="on-stage border-t border-stage-border pb-[calc(var(--sticky-cta-h)+2.5rem)] pt-16 text-[0.9375rem]">
      <div className="container-x grid gap-10 text-stage-muted md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="flex items-center gap-3 text-stage-foreground">
            <Monogram id="logo-rodape" className="h-9 w-auto" />
            <Wordmark />
          </span>
          <p className="mt-5 max-w-[24rem]">
            Engenharia e regularização imobiliária em {empresa.cidade}, {empresa.uf}, e cidades da região.
          </p>
        </div>

        <dl className="space-y-1.5">
          <div className="flex gap-2">
            <dt>CNPJ</dt>
            <dd className="text-stage-foreground">{empresa.cnpj}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Registro de engenharia</dt>
            <dd className="text-stage-foreground">{empresa.crea}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Registro de advocacia</dt>
            <dd className="text-stage-foreground">{empresa.oab}</dd>
          </div>
        </dl>

        <div>
          <a href={empresa.instagram} target="_blank" rel="noopener noreferrer" className="link-quiet text-stage-foreground">
            Instagram {empresa.instagramHandle}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="mt-2">
            © {ano} {empresa.razaoSocial}
          </p>
        </div>
      </div>
    </footer>
  );
}
