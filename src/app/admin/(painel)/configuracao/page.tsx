import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { BotaoSincronizar, ControlesDemo, CopiarTexto } from "@/components/painel/AcoesConfig";
import { ChaveAparelhoInterno } from "@/components/painel/AparelhoInterno";
import { Cartao } from "@/components/painel/blocos";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { EsqueletoPainel } from "@/components/painel/estados";
import { contextoPainel } from "@/lib/painel/contexto";
import { criarConsultas } from "@/lib/painel/consultas";
import { dataHora, num } from "@/lib/painel/formato";
import { metaConfigurada } from "@/lib/painel/meta-ads";

export const metadata: Metadata = { title: "Configuração" };

const PARAMETROS_URL =
  "utm_source={{site_source_name}}&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&utm_id={{campaign.id}}&jv_adset={{adset.id}}&jv_ad={{ad.id}}";

export default function Configuracao() {
  return (
    <Suspense fallback={<EsqueletoPainel />}>
      <Conteudo />
    </Suspense>
  );
}

function Estado({ ok, aviso, rotulo }: { ok: boolean; aviso?: boolean; rotulo: string }) {
  const estilo = ok ? "bg-[#e7f6e7] text-[#006300]" : aviso ? "bg-[#fff4d6] text-[#7a5300]" : "bg-[#fdecea] text-[#b42318]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${estilo}`}>
      <span aria-hidden="true">{ok ? "✓" : aviso ? "!" : "✕"}</span>
      {rotulo}
    </span>
  );
}

function Linha({ titulo, estado, children }: { titulo: string; estado: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#eef1f5] py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[0.9375rem] font-semibold text-[#0a1f3f]">{titulo}</h3>
        {estado}
      </div>
      <div className="text-[0.875rem] text-[#4a5870]">{children}</div>
    </div>
  );
}

async function Conteudo() {
  const ctx = await contextoPainel();
  const real = ctx.banco ? await criarConsultas(ctx.banco, "public").estado() : null;
  const demo = ctx.banco ? await criarConsultas(ctx.banco, "demo").estado() : null;
  const syncMeta = real?.sincronizacoes.find((s) => s.fonte === "meta");
  const pixel = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const capi = Boolean(process.env.META_CAPI_TOKEN);
  const senhaDefinida = Boolean(process.env.ADMIN_PASSWORD);

  return (
    <>
      <CabecalhoPagina titulo="Configuração" descricao="Conexões do painel, marcação dos anúncios e dados de demonstração." />
      <div className="grid gap-4 px-4 pb-8 sm:px-6 lg:px-8 xl:grid-cols-2">
        <Cartao titulo="Conexões">
          <Linha
            titulo="Banco de dados"
            estado={<Estado ok={Boolean(ctx.banco)} rotulo={ctx.banco ? (ctx.banco.tipo === "neon" ? "Neon conectado" : "Banco local (desenvolvimento)") : "Não configurado"} />}
          >
            {ctx.banco ? (
              <>
                {num(real?.eventos ?? 0)} eventos e {num(real?.leads ?? 0)} leads gravados.
                {real?.ultimoEvento && <> Último evento: {dataHora(real.ultimoEvento)}.</>}
              </>
            ) : (
              <>Crie um banco Neon em Vercel › Storage e conecte ao projeto. A variável DATABASE_URL é criada sozinha.</>
            )}
            {ctx.erro && <p className="mt-1 text-[#b42318]">Erro: {ctx.erro}</p>}
          </Linha>

          <Linha
            titulo="Meta Ads (investimento)"
            estado={
              <Estado
                ok={metaConfigurada() && syncMeta?.ok === true}
                aviso={metaConfigurada() && !syncMeta}
                rotulo={!metaConfigurada() ? "Não configurado" : syncMeta ? (syncMeta.ok ? "Sincronizado" : "Falhou") : "Aguardando 1ª sincronização"}
              />
            }
          >
            {metaConfigurada() ? (
              <div className="flex flex-col gap-3">
                <p>
                  Sincroniza todo dia às 6h (Brasília) os últimos 35 dias de cada anúncio.
                  {syncMeta?.executado_em && <> Última vez: {dataHora(syncMeta.executado_em)}. </>}
                  {syncMeta?.mensagem && <span className={syncMeta.ok ? "" : "text-[#b42318]"}>{syncMeta.mensagem}</span>}
                </p>
                <BotaoSincronizar habilitado={Boolean(ctx.banco) && !ctx.demo} />
              </div>
            ) : (
              <ol className="list-decimal space-y-1 pl-5">
                <li>No Gerenciador de Negócios, crie um usuário do sistema com acesso à conta de anúncios.</li>
                <li>Gere um token com a permissão ads_read.</li>
                <li>
                  Na Vercel, cadastre <code className="font-mono text-[0.8125rem]">META_ADS_TOKEN</code>, <code className="font-mono text-[0.8125rem]">META_AD_ACCOUNT_ID</code> (o número da conta) e{" "}
                  <code className="font-mono text-[0.8125rem]">CRON_SECRET</code> (qualquer texto longo) e faça um novo deploy.
                </li>
              </ol>
            )}
          </Linha>

          <Linha titulo="Pixel e API de Conversões" estado={<Estado ok={pixel && capi} aviso={pixel !== capi} rotulo={pixel && capi ? "Pixel + CAPI" : pixel ? "Só Pixel" : capi ? "Só CAPI" : "Não configurado"} />}>
            Visitas e conversas também são enviadas à Meta para otimizar as campanhas. Variáveis: <code className="font-mono text-[0.8125rem]">NEXT_PUBLIC_META_PIXEL_ID</code> e{" "}
            <code className="font-mono text-[0.8125rem]">META_CAPI_TOKEN</code>.
          </Linha>

          <Linha titulo="Senha do painel" estado={<Estado ok={senhaDefinida} aviso={!senhaDefinida && !process.env.VERCEL} rotulo={senhaDefinida ? "Definida" : process.env.VERCEL ? "Não definida" : "Senha local padrão"} />}>
            Definida na variável <code className="font-mono text-[0.8125rem]">ADMIN_PASSWORD</code>. Trocar a senha encerra todas as sessões abertas.
          </Linha>
        </Cartao>

        <Cartao titulo="Marcação dos anúncios" subtitulo="Cole em cada anúncio da Meta, em Rastreamento › Parâmetros de URL.">
          <div className="flex flex-col gap-4 text-[0.875rem] text-[#4a5870]">
            <CopiarTexto texto={PARAMETROS_URL} rotulo="Copiar parâmetros" />
            <p>
              A Meta troca os campos entre chaves pelo nome e pelo número real da campanha, do conjunto e do anúncio. É isso que liga cada visita e cada conversa ao anúncio que a trouxe, e
              o investimento ao resultado.
            </p>
            <p>
              Para versões da página no teste A/B, aponte o anúncio para <code className="font-mono text-[0.8125rem]">/v2</code> ou <code className="font-mono text-[0.8125rem]">/v3</code> (ou
              as do imóvel rural) e compare em <strong className="font-semibold text-[#0a1f3f]">No site › Versões da página</strong>.
            </p>
          </div>
        </Cartao>

        <Cartao titulo="Este aparelho" subtitulo="Para os testes da equipe não entrarem nos números.">
          <ChaveAparelhoInterno />
        </Cartao>

        <Cartao titulo="Dados de demonstração" subtitulo="90 dias de tráfego fictício, guardados à parte dos dados reais.">
          <p className="mb-4 text-[0.875rem] text-[#4a5870]">
            Servem para conhecer o painel e treinar a equipe antes de existirem dados de verdade. Enquanto a demonstração estiver ligada, uma faixa dourada fica no topo de todas as telas.
            {demo && demo.eventos > 0 && <> Hoje há {num(demo.eventos)} eventos e {num(demo.leads)} leads de demonstração.</>}
          </p>
          {ctx.banco ? <ControlesDemo ativo={ctx.demo} temDados={Boolean(demo && demo.eventos > 0)} /> : <p className="text-[0.875rem] text-[#6b7688]">Disponível depois de conectar o banco.</p>}
        </Cartao>
      </div>
    </>
  );
}
