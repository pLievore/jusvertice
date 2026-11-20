import type { Origem } from "@/content/origens";
import { empresa } from "@/content/site";
import { Monogram, Wordmark } from "./Logo";
import { Vertice } from "./Marcos";
import { WhatsAppLink } from "./WhatsAppLink";

async function anoAtual() {
  "use cache";
  return new Date().getFullYear();
}

const soDigitos = (t: string) => t.replace(/\D/g, "");

export async function SiteFooter({ origem }: { origem: Origem }) {
  const ano = await anoAtual();
  return (
    <footer className="on-stage bg-stage-deep pb-[calc(var(--sticky-cta-h)+2.5rem)] pt-16 text-[0.9375rem]">
      <div className="container-x">
        <div className="grid gap-10 text-stage-muted md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-3 text-stage-foreground">
              <Monogram id="logo-rodape" className="h-10 w-auto" />
              <Wordmark />
            </span>
            <p className="mt-5 max-w-[24rem]">
              Georreferenciamento, topografia e regularização imobiliária em {empresa.regiao}, {empresa.uf}.
            </p>
          </div>

          <div>
            <h2 className="rotulo">
              <Vertice size={12} />
              Contato
            </h2>
            <ul className="mt-3 space-y-0.5">
              <li>
                <WhatsAppLink origem={origem} className="link-quiet text-stage-foreground">
                  WhatsApp
                </WhatsAppLink>
              </li>
              {/* Telefones e e-mail aparecem quando forem preenchidos em site.ts */}
              {empresa.telefones.map((tel) => (
                <li key={tel}>
                  <a href={`tel:+55${soDigitos(tel)}`} className="link-quiet text-stage-foreground">
                    {tel}
                  </a>
                </li>
              ))}
              {empresa.email && (
                <li>
                  <a href={`mailto:${empresa.email}`} className="link-quiet text-stage-foreground">
                    {empresa.email}
                  </a>
                </li>
              )}
              <li>
                <a href={empresa.instagram} target="_blank" rel="noopener noreferrer" className="link-quiet text-stage-foreground">
                  Instagram {empresa.instagramHandle}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="rotulo">
              <Vertice size={12} />
              Registros
            </h2>
            <dl className="mt-4 space-y-1.5">
              <div>
                <dt className="sr-only">Registro no CREA</dt>
                <dd className="text-stage-foreground">{empresa.crea}</dd>
              </div>
              <div>
                <dt className="sr-only">Registro nacional</dt>
                <dd className="text-stage-foreground">{empresa.rn}</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="tracejado mt-12 bg-[length:8px_1px] bg-top pt-6 text-[0.875rem] text-stage-muted">
          © {ano} {empresa.razaoSocial}
        </p>
      </div>
    </footer>
  );
}
