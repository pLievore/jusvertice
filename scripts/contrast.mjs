// Verifica contraste WCAG dos pares de cor usados no site (tokens de src/app/globals.css).
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const pairs = [
  // [texto, fundo, uso, mínimo]
  ['#0A1F3F', '#F3F5F8', 'texto / fundo claro', 4.5],
  ['#0A1F3F', '#E7ECF2', 'texto / superfície', 4.5],
  ['#4A5870', '#F3F5F8', 'texto suave / fundo claro', 4.5],
  ['#4A5870', '#E7ECF2', 'texto suave / superfície', 4.5],
  ['#4A5870', '#FFFFFF', 'texto suave / cartão', 4.5],
  ['#7E5F20', '#F3F5F8', 'rótulo dourado / fundo claro', 4.5],
  ['#7E5F20', '#E7ECF2', 'rótulo dourado / superfície', 4.5],
  ['#F4F2EC', '#002448', 'texto / azul da marca', 4.5],
  ['#AFBCD1', '#002448', 'texto suave / azul', 4.5],
  ['#AFBCD1', '#001A36', 'texto suave / rodapé', 4.5],
  ['#CCA85E', '#002448', 'rótulo e destaque dourados / azul', 4.5],
  ['#002448', '#CCA85E', 'texto do botão / dourado', 4.5],
  ['#002448', '#E3C680', 'texto do botão (hover) / dourado claro', 4.5],
  ['#FFFFFF', '#002448', 'texto do botão / azul', 4.5],
  ['#FFFFFF', '#0A3262', 'texto do botão (hover) / azul', 4.5],
  ['#002448', '#E26D52', 'número do apontamento / alerta', 4.5],
  ['#B23A22', '#FFFFFF', 'ícone de irregular / cartão (3:1)', 3],
  ['#AFBCD1', '#002448', 'borda da caixa de seleção / azul (3:1)', 3],
  ['#F4F2EC', '#002448', 'foco / azul (3:1)', 3],
  ['#0A1F3F', '#F3F5F8', 'foco / fundo claro (3:1)', 3],
];
let fail = 0;
for (const [fg, bg, uso, min] of pairs) {
  const r = ratio(fg, bg); const ok = r >= min; if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1  (mín ${min})  ${fg} sobre ${bg}  ${uso}`);
}
process.exit(fail ? 1 : 0);
