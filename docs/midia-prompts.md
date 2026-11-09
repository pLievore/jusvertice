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

## 1. Vídeo do hero (Veo 3.1) — topografia/georreferenciamento

Pedido da Gabi (28/10): trocar a casa do topo por topografia/georreferenciamento, mantendo o efeito de o vídeo avançar com a rolagem.

### O que o vídeo precisa ter (por causa do scrubbing)

- **Uma progressão única do começo ao fim.** Aqui: *do escuro à clareza*. O campo começa na penumbra antes do amanhecer e o sol nasce iluminando os marcos e o receptor, como o levantamento esclarece a situação do imóvel. A luz só pode **subir**: se ela oscilar, a rolagem pisca.
- **Plano único, sem cortes.** Corte vira salto no meio da rolagem.
- **Câmera parada.** Movimento de câmera no Veo é a maior fonte de tremor e de arquitetura "derretendo". A luz mudando já dá o movimento.
- **Composição para o texto:** o receptor no **terço direito**, horizonte no terço superior e o **canto inferior esquerdo em sombra**, que é onde fica o título no desktop. No celular o vídeo aparece inteiro numa faixa 16:9, então o receptor não pode ser pequeno demais.

### Método recomendado: primeiro e último quadro (Flow › Frames to Video)

É o modo que dá mais controle: você define como o vídeo começa e termina, e o Veo só gera a transição. Fontes secundárias relatam que o modelo segue o primeiro quadro de perto e o último como alvo mais solto, e que saltos grandes entre os dois geram artefatos. Por isso os dois quadros são **a mesma imagem**, mudando só a luz.

**Passo 1. Último quadro (casa "regularizada" = campo iluminado).** Gere a imagem em 16:9, 1920×1080 ou maior:

```
Wide 16:9 landscape photograph, eye-level shot from about one meter above the ground. On the right third of the frame stands a GNSS RTK survey receiver on a yellow tripod, set over a small square concrete boundary marker, sharp and clearly lit. A straight line of thin wooden survey stakes with orange ribbons runs from the tripod toward the horizon, tracing the edge of a rural property. Rows of young soybean plants fill the right half of the field; a strip of red earth runs along the left edge. The low morning sun is just outside the frame on the left, so warm golden light comes from the left side, lighting the left faces of the tripod, the stakes and the concrete marker, and every object casts a long shadow toward the right. The sun itself is not visible. A flat horizon sits in the upper third of the frame. The lower left corner of the frame falls into soft shadow. Farmland in northern Paraná, Brazil. 35mm lens, deep depth of field, photorealistic documentary photography, natural colors, clear sky shading from deep blue at the top to soft gold at the horizon.
```

Prompt negativo, se a ferramenta tiver o campo (o guia do Google recomenda substantivos simples, não "no …"):

```
text, letters, logo, watermark, people, vehicles, power lines, buildings
```

**Passo 2. Primeiro quadro.** Não gere do zero: **edite a imagem do passo 1**. A edição mantém a geometria idêntica, e é isso que evita o "derretimento" na transição.

```
Same photograph, same framing, same tripod, receiver, stakes and field in exactly the same positions. Change only the time of day to blue-hour twilight about twenty minutes before sunrise: deep blue ambient light, the sun below the horizon, a faint pale glow along the horizon line, the whole field in cool blue shadow, the tripod and stakes visible as soft dark silhouettes.
```

Confira lado a lado: tripé, estacas e horizonte precisam estar no mesmo lugar nas duas imagens.

**Checklist da imagem final (antes de gastar créditos de vídeo):**
- **Luz coerente:** as sombras saem do lado oposto ao sol, e as faces voltadas para o sol são as iluminadas. Sol atrás do objeto exige contraluz (frente escura, sombra vindo para a câmera). Modelo de imagem erra muito isso; prefira o sol fora do quadro, de lado.
- **Marco sob o centro do tripé:** o prumo central desce direto no marco de concreto (o agrimensor vai notar).
- Receptor no terço direito, nítido; estacas em linha; canto inferior esquerdo mais escuro; nenhum texto, pessoa ou veículo.

Escolhida em 28/10: variação com o sol fora do quadro à esquerda, luz lateral e sombras para a direita.

**Passo 3. Vídeo.** Flow › Frames to Video, com o passo 2 como **início** e o passo 1 como **fim**.

- **Modelo:** Veo 3.1 (o principal, não o Fast nem o Lite).
- **Duração:** 8 s.
- **Formato:** 16:9.
- **Resolução:** 1080p. O vídeo anterior veio em 720p e limita a nitidez no desktop.
- **Gere 4 variações** e escolha pelo validador (abaixo). Ninguém garante um único resultado de um modelo generativo; o que dá segurança é gerar algumas e filtrar.

No modo primeiro/último quadro, o prompt descreve **só o movimento e a mudança**, sem repetir a imagem:

```
Locked-off static camera on a tripod, one continuous shot with no camera movement. A smooth time-lapse of sunrise over the soybean field, with the sun rising just outside the frame on the left: the deep blue pre-dawn light gradually warms, the sky near the horizon turns from pale blue to soft gold, and warm low sunlight sweeps in from the left side across the field, lighting the left faces of the survey stakes one by one and finally the GNSS receiver, the yellow tripod and the concrete marker in the foreground, while their long shadows grow toward the right. The sun itself stays out of the frame. Thin high clouds drift slowly and the soybean leaves sway gently in a light breeze. The light changes evenly and continuously, growing steadily brighter from start to finish. Photorealistic, natural colors.

Audio: soft morning wind and distant birds.
```

O áudio é descartado pelo site; a frase de áudio só evita que o Veo invente música ou voz.

### Plano B: só texto (se o Frames to Video não estiver disponível)

Mesmas configurações (Veo 3.1, 8 s, 16:9, 1080p, 4 variações):

```
Wide 16:9 landscape shot, eye-level from about one meter above the ground, locked-off static camera, one continuous shot. Farmland in northern Paraná, Brazil, at sunrise: on the right third of the frame a GNSS RTK survey receiver on a yellow tripod stands over a small concrete boundary marker, and a straight line of thin wooden survey stakes with orange ribbons runs from it toward a flat horizon, tracing the edge of a soybean field, with a strip of red earth along the left edge. The shot begins in deep blue pre-dawn twilight with the equipment as dark silhouettes; as the sun rises just outside the frame on the left, warm low sunlight sweeps in from the left side across the field, lighting the left faces of the stakes and finally the receiver and tripod in the foreground, their long shadows growing toward the right. The sun itself stays out of the frame. The lower left corner stays in soft shadow. Thin clouds drift slowly, leaves sway gently. The light grows steadily brighter from start to finish. 35mm lens, deep depth of field, photorealistic documentary style, natural colors.

Audio: soft morning wind and distant birds.
```

### Antes de usar: validar

```bash
npm run validar-hero -- caminho/da/variacao.mp4
```

O validador mede quadro a quadro:

- **Resolução:** pelo menos 1920×1080.
- **Duração:** de 6 a 10 s.
- **Cortes e saltos:** nenhum.
- **Progressão:** a luz precisa subir do começo ao fim.
- **Piscadas:** nenhuma queda de luz entre quadros.
- **Tremor:** abaixo do limite.

Use a variação aprovada. Se nenhuma passar, ele aponta o quadro com defeito; às vezes basta cortar o começo ou o fim, por exemplo `ffmpeg -ss 0.5 -to 7.5 -i entrada.mp4 -c copy saida.mp4`.

### Colocar no site

Salve a variação aprovada como `midia-fonte/hero.mp4` (substituindo o atual) e rode

```bash
node scripts/montar-hero.mjs midia-fonte/hero.mp4
npm run build
```

Depois atualize `hero.posterAlt` em `src/content/site.ts`, por exemplo para "Receptor de georreferenciamento num campo de soja ao nascer do sol.".

Fontes: [guia de prompts de vídeo do Google](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide), [boas práticas](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice), [Veo 3.1](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/veo/3-1-generate), [primeiro e último quadro](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/generate-videos-from-first-and-last-frames), além de guias de terceiros sobre o Flow ([eachlabs](https://www.eachlabs.ai/blog/veo-3-1-first-and-last-frame-guide), [dev.to](https://dev.to/akaranjkar08/veo-31-developer-guide-timestamp-prompting-multi-shot-video-and-full-api-june-2026-3l5i)).

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
| `situacao-georreferenciamento.jpg` | 16:10 · 1800×1125 | Situações · Georreferenciamento rural (hoje usa a foto da capacidade técnica) |
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

**situacao-georreferenciamento.jpg**
```
A rural property owner in his fifties standing at the edge of his soybean field in northern Paraná at golden hour, holding a folder of property documents, looking at a concrete boundary marker with an orange survey ribbon at his feet, red soil, wide open sky, editorial documentary photography, photorealistic, face in soft profile, no legible text.
```

**cta-final.jpg**
```
Wide cinematic shot of a modern two-story house at night seen from its garden, every window glowing warm amber, deep navy sky, calm reflections on a stone path, peaceful atmosphere, photorealistic architectural photography, no people, no text. Keep the lower half darker for overlaid text.
```

---

## 3. Página de georreferenciamento (/georreferenciamento)

Hoje a página reaproveita imagens da principal: situações herança e crédito, topografia, projetos e gaveta. O topo e o campo vêm do vídeo novo. Substitua pelas peças abaixo, nesta ordem de prioridade. Salve em `midia-fonte/` e rode `node scripts/otimizar-midia.mjs`. Depois troque o import em `src/content/georreferenciamento.ts` (eu faço isso se você me avisar).

Regras: as mesmas da seção 2 (fotorrealista, sem texto legível, sem logos). Atenção à **luz coerente**: sol e sombras do mesmo lado.

**1. `georref-comparador.jpg`**: 16:9, 2400×1340. Ativa o comparador "matrícula x área medida", como o da casa na página principal.
```
Straight-down aerial drone photograph of a rural property in northern Paraná, Brazil, in soft morning light: rectangular soybean plots in different shades of green, a red dirt road, a small farmhouse with a metal roof, a row of eucalyptus trees along one boundary and a winding stream with riparian forest along another. The property boundaries are clearly readable from the patterns of fences, roads and crops. Top-down orthographic view, sharp, high detail, natural colors, photorealistic.
```

**2. `situacao-heranca-rural.jpg`**: 16:10, 1800×1125
```
An elderly farmer and his adult daughter standing side by side at the porch of a simple farmhouse in rural Paraná, looking out at their soybean fields at golden hour, the daughter holding a folder of property documents, warm side light from the left with shadows falling to the right, editorial documentary photography, photorealistic, faces in soft profile, no legible text.
```

**3. `situacao-divisa-rural.jpg`**: 16:10, 1800×1125
```
A barbed-wire fence with wooden posts running along the edge of a soybean field in northern Paraná, a concrete boundary marker at the base of one post, the neighboring pasture on the other side of the fence, low morning light from the left with long shadows to the right, eye-level view along the fence line, photorealistic documentary photography, no people, no text.
```

**4. `situacao-credito-rural.jpg`**: 16:10, 1800×1125
```
Close-up of weathered hands of a farmer and the clean hands of a bank manager over a wooden desk with a rural credit contract, a property map of a farm and a cup of coffee, soft window light, shallow depth of field, editorial photography, photorealistic, documents out of focus so no text is legible.
```

**5. `capacidade-sigef.jpg`**: 4:5, 1400×1750
```
A surveyor processing GNSS data at a desk, a laptop screen showing a property boundary polygon over a satellite map, a field notebook and a GNSS receiver beside it, soft daylight, vertical composition, editorial photography, photorealistic, screen content blurred so no text is legible.
```

---

## 4. Fotos reais da cliente (substituem IA quando chegarem)

Prioridade: Gabriella e PH em alta resolução (a de hoje é recorte do post fixado, 1080 px), PH em campo com o equipamento e a equipe no escritório.
Foto real sempre ganha de imagem gerada em serviço de confiança.
