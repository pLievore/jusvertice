# JusVértice — landing de regularização imobiliária

Landing de captação (Next.js 16 + Tailwind 4 + Motion + Lenis) construída a partir de `jusvertice-plano-site.md`, no padrão visual do Andre-Watch e da DG Pinturas.
Todos os botões levam ao WhatsApp com mensagem pré-preenchida por origem, e a página instrumenta os estágios do funil.

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

## Onde mexer

| O quê | Onde |
| --- | --- |
| Todo o texto, WhatsApp, CNPJ/CREA/OAB, cidades, modo do diagnóstico | `src/content/site.ts` |
| Mensagem de cada botão (por origem) | `origens` em `src/content/site.ts` |
| Diagnóstico gratuito / neutro / cobrado | `diagnostico.modo` em `src/content/site.ts` |
| Seções da página | `src/components/sections/*` (ordem em `src/app/page.tsx`) |
| Cores, tipografia e animações em CSS | `src/app/globals.css` |
| Mídia (imagens e vídeo do hero) | `public/midia/` · prompts em `docs/midia-prompts.md` |
| Eventos do funil (cliente) | `src/lib/tracking.ts` |
| Coletor / API de Conversões (servidor) | `src/app/api/events/route.ts` |

Itens marcados com `PENDENTE` em `site.ts` bloqueiam a publicação.

## Mídia

Originais em `midia-fonte/` (fora do deploy). Versões web em `public/midia/`.

```bash
node scripts/otimizar-midia.mjs                       # imagens → src/assets/midia (import com hash, sem cache velho)
node scripts/gerar-planta.mjs                         # "projeto" do comparador, gerado da foto antes-depois
node scripts/montar-hero.mjs midia-fonte/hero.mp4    # vídeo: quadros do desktop, vídeo do celular, posters
npm run build
```

No desktop o vídeo avança com a rolagem (as luzes da casa acendem conforme a pessoa desce); no celular toca uma vez e para com a casa acesa. Movimento reduzido mostra o quadro final, parado. Prompts das peças em `docs/midia-prompts.md`.

## Medição

| Estágio do plano | Evento | Meta |
| --- | --- | --- |
| Chegada, com origem | `page_view` (+ UTMs/fbclid guardados por 30 dias) | `PageView` |
| Leu a página | `checklist_lido`, `scroll_50`, `scroll_90` | custom |
| Iniciou conversa | `whatsapp_click { origem }` | `Contact` |
| Virou atendimento | marcação manual pelo **código** (`JV-XXXX`) que vai no fim da mensagem | — |

Cada evento vai para `window.dataLayer`, para o Pixel (se configurado) e para `/api/events`,
com o mesmo `event_id` para deduplicar Pixel × CAPI.

### Variáveis de ambiente (Vercel)

| Variável | Para quê |
| --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Carrega o Pixel no navegador |
| `META_CAPI_TOKEN` | Liga o envio pela API de Conversões |
| `META_TEST_EVENT_CODE` | (opcional) valida eventos no Gerenciador de Eventos |
| `META_GRAPH_VERSION` | (opcional) padrão `v24.0` |

Sem essas variáveis, a página funciona normalmente e o coletor só valida e descarta.

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
