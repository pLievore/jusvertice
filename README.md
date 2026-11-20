# JusVértice — landing de regularização imobiliária

Landing de captação (Next.js 16 + Tailwind 4 + Motion + Lenis) construída a partir de `jusvertice-plano-site.md`.
A identidade visual sai dos posts da marca: azul `#002448` e dourado `#CCA85E`, títulos em Barlow Condensed caixa alta, texto em Barlow, e o marco de vértice com linha tracejada como assinatura (tokens e regras em `src/app/globals.css`, peças em `src/components/Marcos.tsx`).
Todos os botões levam ao WhatsApp com mensagem pré-preenchida por origem, e a página instrumenta os estágios do funil.

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

## Páginas

| Rota | Público | Conteúdo |
| --- | --- | --- |
| `/` | Regularização imobiliária (urbano) | `src/content/site.ts` › `paginaRegularizacao` |
| `/georreferenciamento` | Regularização de propriedade rural (medição, georreferenciamento, retificação, desmembramento, registro) | `src/content/georreferenciamento.ts` |
| `/v2`, `/v3`, `/georreferenciamento/v2`, `/v3` | Versões do hero para teste A/B (fora do Google) | `src/content/variantes.ts` |
| `/admin` | Painel de resultados (senha) | `src/app/admin` |

As duas usam os mesmos componentes (`src/components/PaginaLanding.tsx`) com conteúdo no formato `Pagina` (`src/content/tipos.ts`). Cada página tem origens de WhatsApp próprias (a rural usa `georref-*`), então o painel separa os leads por página e por botão.

## Onde mexer

| O quê | Onde |
| --- | --- |
| Todo o texto, WhatsApp, CREA/RN, e-mail e telefones, regiões, modo do diagnóstico | `src/content/site.ts` |
| Mensagem de cada botão (por origem) | `src/content/origens.ts` |
| Diagnóstico gratuito / neutro / cobrado | `diagnostico.modo` em `src/content/site.ts` |
| Seções da página | `src/components/sections/*` (ordem em `src/components/PaginaLanding.tsx`) |
| Cores, tipografia e animações em CSS | `src/app/globals.css` |
| Mídia (imagens e vídeo do hero) | `public/midia/` · prompts em `docs/midia-prompts.md` |
| Catálogo de eventos (o que é medido) | `src/lib/eventos.ts` |
| Eventos do funil (cliente) | `src/lib/tracking.ts` e `src/components/PageEffects.tsx` |
| Coletor / gravação / API de Conversões (servidor) | `src/app/api/events/route.ts` |
| Consultas e definições das métricas do painel | `src/lib/painel/consultas.ts` |

Itens marcados com `PENDENTE` em `site.ts` bloqueiam a publicação.

## Mídia

Originais em `midia-fonte/` (fora do deploy). Versões web em `public/midia/`.

```bash
node scripts/otimizar-midia.mjs                       # imagens → src/assets/midia (import com hash, sem cache velho)
node scripts/gerar-planta.mjs                         # "projeto" do comparador, gerado da foto antes-depois
node scripts/montar-hero.mjs midia-fonte/hero.mp4    # vídeo: quadros do desktop, vídeo do celular, posters
npm run build
```

No desktop o vídeo avança com a rolagem (o dia nasce sobre o campo conforme a pessoa desce); no celular toca uma vez e para no último quadro. Movimento reduzido mostra o quadro final, parado. Prompts das peças em `docs/midia-prompts.md`.

## Medição

| Estágio do plano | Evento | Vai para a Meta |
| --- | --- | --- |
| Chegada, com origem | `page_view` (+ UTMs, `jv_ad`, `jv_adset`, fbclid e gclid guardados por 30 dias) | `PageView` |
| Leu a página | `checklist_lido`, `scroll_50`, `scroll_90`, `secao_vista { secao }`, `engajamento { segundos }` | os três primeiros, como evento personalizado |
| Interagiu | `checklist_marcado { item, marcado }`, `comparador_usado`, `faq_aberta { pergunta }`, `autodiagnostico_click`, `navegacao_click { destino }`, `contato_click { canal }` | só `faq_aberta` |
| Iniciou conversa | `whatsapp_click { origem }` (cria o lead pelo código `JV-XXXX` que vai na mensagem) | `Contact` |
| Virou atendimento / fechou | andamento e valor marcados em `/admin/leads` | — |

Cada evento vai para `window.dataLayer`, para `/api/events` (que grava no banco) e, os combinados, para o Pixel
e a API de Conversões com o mesmo `event_id`. O coletor classifica aparelho, navegador (inclusive o navegador
interno do Instagram e do Facebook), fonte do tráfego e cidade pelo cabeçalho da Vercel, **sem guardar IP**.
Robôs e aparelhos marcados como internos (todo aparelho que entra no painel) não contam.

## Painel (`/admin`)

| Tela | O que responde |
| --- | --- |
| Visão geral | Conversas, custo por conversa, clientes, receita e ROAS contra o período anterior; funil; botões e fontes que convertem; aparelhos; cidades; dia × hora das conversas; leitura rápida em frases |
| Campanhas | Investimento, CPM, CTR, custo por conversa e por cliente; gasto diário por campanha; custo por conversa semanal; matriz de anúncios; tabela campanha › conjunto › anúncio |
| No site | Até onde as pessoas rolam, tempo de atenção, itens marcados, perguntas abertas, navegador/app, teste A/B das versões com confiança estatística |
| Leads | Quadro por andamento, busca pelo código JV, valor do contrato e linha do tempo do que cada pessoa fez no site antes de chamar |
| Configuração | Estado das conexões, sincronização com a Meta, parâmetros de URL dos anúncios, aparelho interno e dados de demonstração |

Clicar num botão, fonte, aparelho ou campanha filtra o painel inteiro (filtro cruzado); filtros e período ficam na URL.
Os dados de demonstração ficam no esquema `demo` do banco, separados dos reais, e uma faixa dourada avisa quando estão na tela.

Sem `DATABASE_URL`, na máquina local o painel usa um Postgres em WASM (PGlite) gravado em `.data/` (senha local: `jusvertice`).

### Variáveis de ambiente (Vercel)

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | Banco do painel (Neon, criado em Vercel › Storage) |
| `ADMIN_PASSWORD` | Senha do painel |
| `ADMIN_SESSION_SECRET` | (opcional) segredo extra da sessão; trocar derruba todas as sessões |
| `META_ADS_TOKEN` | Token de usuário do sistema com `ads_read` (gasto e entrega dos anúncios) |
| `META_AD_ACCOUNT_ID` | Número da conta de anúncios (com ou sem `act_`) |
| `CRON_SECRET` | Protege a sincronização diária (`/api/cron/meta`, 6h de Brasília, `vercel.json`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Carrega o Pixel no navegador |
| `META_CAPI_TOKEN` | Liga o envio pela API de Conversões |
| `META_TEST_EVENT_CODE` | (opcional) valida eventos no Gerenciador de Eventos |
| `META_GRAPH_VERSION` | (opcional) padrão `v24.0` |

Sem essas variáveis, a página funciona normalmente: sem banco, o coletor só valida e descarta e o painel mostra o passo a passo da configuração.

## Testes

```bash
npm run test:e2e       # Playwright: axe (WCAG 2.2 AA) + UX, celular e desktop (usa o Chrome instalado)
npm run test:contrast  # contraste da paleta
npm run lighthouse     # Lighthouse celular  (com o servidor rodando em :3100)
npm run shots          # capturas de tela para revisão visual
```

A suíte cobre: axe com e sem movimento reduzido, mensagem certa em cada botão de WhatsApp,
código de atendimento, eventos do funil, checklist (mouse, teclado e marcação feita antes do JS carregar),
FAQ por teclado, ausência de rolagem horizontal de 320 a 1024 px, zoom de texto de 200%, alvos de toque de 44 px ou mais,
barra fixa do celular, foco nunca escondido atrás dela (WCAG 2.4.11), página sem JavaScript e validação do coletor.
No painel: entrada por senha, painel fora do Google, o coletor gravando um clique real até virar lead (marcado como fechado e excluído),
todas as telas sem erro com a demonstração, filtro cruzado, axe nas telas principais e nada estourando a largura no celular.
