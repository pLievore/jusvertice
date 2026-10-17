# Mídia da landing — prompts e onde cada arquivo entra

**Status (17/10/2026):** mídia definitiva entregue. Originais em `midia-fonte/` (fora do deploy, ver `.vercelignore`).

Para trocar alguma peça: salve o novo original em `midia-fonte/` com o mesmo nome e rode

```bash
node scripts/otimizar-midia.mjs                       # imagens → src/assets/midia
node scripts/gerar-planta.mjs                         # se trocar antes-depois.jpg: refaz a planta e confira os pontos em site.ts
node scripts/montar-hero.mjs midia-fonte/hero.mp4    # vídeo do hero
npm run build
```

Regras para todas as peças:
- Fotorrealista, editorial, luz natural. Cenário brasileiro (Maringá, norte do Paraná).
- **Sem texto, sem logos, sem marca-d'água, sem placas com letras legíveis.**
- Paleta da marca na correção de cor: sombras azul-noite, luzes âmbar quentes.
- Os prompts estão em inglês porque Veo e os geradores de imagem respondem melhor assim.

---

## 1. Vídeo do hero (Veo 3)

**Conceito:** "Da irregularidade à tranquilidade". A casa começa apagada no fim de tarde e as luzes acendem cômodo a cômodo, como se o imóvel "voltasse a ficar em ordem".

**Especificação:** 16:9, 1080p, 8 s, sem áudio. Câmera estável, sem cortes. Assunto **centralizado** (o celular recebe um recorte 3:4 do centro). Terço inferior esquerdo mais escuro (é onde fica o texto).

**Prompt principal:**

```
Cinematic slow dolly-in toward a modern two-story house in a quiet Brazilian residential street at blue hour, Maringá, Paraná. The house has clean white volumes, large glass windows and warm wood panels. At the start every window is dark; over the shot the interior lights turn on one room at a time, a soft warm amber glow filling each window, until the whole house is lit and calm. Deep navy sky, a few trees moving gently in the breeze, wet-looking dark lawn in the foreground. Locked horizon, smooth steady camera, 35mm lens, shallow depth of field, photorealistic, high dynamic range, the lower left third of the frame stays dark. No people, no text, no logos, no cars, no camera shake, no morphing architecture.
```

**Alternativa (topografia):**

```
Slow aerial descent at golden hour over a residential lot in a Brazilian city, red soil typical of northern Paraná. A surveyor's total station on a tripod stands at one corner of the lot; thin survey stakes with orange ribbons mark the property boundary. The camera glides down and slightly forward, revealing a finished modern house next door with warm lights turning on. Photorealistic, cinematic, steady, soft haze, deep blue shadows and warm highlights. No people facing the camera, no text, no logos.
```

**Depois de gerar:**

```bash
node scripts/montar-hero.mjs caminho/do/video.mp4      # 120 quadros por padrão
npm run build
```

O script gera os quadros do desktop (scrubbing pela rolagem), o boomerang 3:4 do celular, os dois posters e liga o modo vídeo em `src/content/hero-midia.json`.
Se o Veo gerar tremor em algum trecho, corte o trecho antes (ex.: `ffmpeg -ss 0.5 -to 7.5 -i in.mp4 -c copy out.mp4`).

---

## 2. Imagens

| Arquivo | Proporção / mínimo | Onde aparece |
| --- | --- | --- |
| `antes-depois.jpg` | 16:9 · 1600×900 | Comparador "arraste para regularizar" |
| `situacao-venda.jpg` | 4:3 · 1200×900 | Situações · Venda travada |
| `situacao-financiamento.jpg` | 4:3 · 1200×900 | Situações · Financiamento negado |
| `situacao-heranca.jpg` | 4:3 · 1200×900 | Situações · Imóvel de herança |
| `situacao-gaveta.jpg` | 4:3 · 1200×900 | Situações · Compra sem escritura |
| `capacidade-topografia.jpg` | 4:5 · 1000×1250 | Capacidade técnica |
| `capacidade-georreferenciamento.jpg` | 4:5 · 1000×1250 | Capacidade técnica |
| `capacidade-projetos.jpg` | 4:5 · 1000×1250 | Capacidade técnica |
| `cta-final.jpg` | ~2.4:1 · 1600×660 | Fundo do CTA final |

**antes-depois.jpg**
```
Frontal eye-level photograph of a modern two-story house in a Brazilian residential neighborhood, soft overcast daylight. On the right side there is a single-story extension (a garage with a flat roof) attached to the main house. Centered composition, the full facade visible with some lawn and sidewalk, straight verticals, architectural photography, photorealistic. No people, no text, no cars.
```

**situacao-venda.jpg**
```
Modern Brazilian house front at late afternoon, a small blank real-estate sign on a wooden stake in the front lawn (no letters on the sign), warm sunlight, calm suburban street, editorial real estate photography, photorealistic, no people, no text.
```

**situacao-financiamento.jpg**
```
Close-up of a person's hands at a wooden desk reviewing printed property documents and a bank financing contract, a set of house keys and reading glasses beside them, soft warm window light, shallow depth of field, editorial photography, photorealistic, documents out of focus so no text is legible.
```

**situacao-heranca.jpg**
```
Elderly hands holding an old folder of property papers and a ring of old brass keys over a wooden kitchen table in a 1980s Brazilian family home, warm afternoon light, nostalgic but calm mood, shallow depth of field, photorealistic, no faces, no legible text.
```

**situacao-gaveta.jpg**
```
A half-open wooden drawer containing a folded paper purchase contract and a set of house keys, seen from above at a slight angle, soft natural light, quiet domestic setting, editorial still life, photorealistic, no legible text.
```

**capacidade-topografia.jpg**
```
A land surveyor operating a total station on a tripod on a sloped urban lot at golden hour, red soil of northern Paraná, survey stakes marking the boundary, city houses in the soft-focus background, vertical composition, photorealistic documentary photography, the surveyor seen from behind or in profile.
```

**capacidade-georreferenciamento.jpg**
```
A GNSS RTK receiver on a survey pole planted at the edge of a large soybean field at sunrise in northern Paraná, red earth, long shadows, wide open sky, vertical composition, photorealistic, no people, no text.
```

**capacidade-projetos.jpg**
```
Architectural floor plans and technical drawings spread on a desk, a scale ruler, a pencil and a laptop partially visible, morning light from a window, top-down slightly angled view, vertical composition, editorial photography, photorealistic, drawings out of focus so no text is legible.
```

**cta-final.jpg**
```
Wide cinematic shot of a modern two-story house at night seen from its garden, every window glowing warm amber, deep navy sky, calm reflections on a stone path, peaceful atmosphere, photorealistic architectural photography, no people, no text. Keep the lower half darker for overlaid text.
```

---

## 3. Fotos reais da cliente (substituem IA quando chegarem)

Prioridade: Gabriella e PH em alta resolução (a de hoje é recorte do post fixado, 1080 px), PH em campo com o equipamento e a equipe no escritório.
Foto real sempre ganha de imagem gerada em serviço de confiança.
