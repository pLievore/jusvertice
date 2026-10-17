// Verifica contraste WCAG dos pares de cor usados no site.
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const pairs = [
  // [texto, fundo, uso, mínimo]
  ['#FFFFFF', '#0A1D3F', 'texto / azul', 4.5],
  ['#B8C2D3', '#0A1D3F', 'texto suave / azul', 4.5],
  ['#B8C2D3', '#071530', 'texto suave / rodapé', 4.5],
  ['#D6B46E', '#0A1D3F', 'números dourados / azul', 4.5],
  ['#071530', '#C9A45C', 'texto do botão / dourado', 4.5],
  ['#071530', '#D6B46E', 'texto do botão (hover) / dourado', 4.5],
  ['#14213D', '#F7F4EE', 'texto / papel', 4.5],
  ['#4B5568', '#F7F4EE', 'texto suave / papel', 4.5],
  ['#4B5568', '#FFFFFF', 'texto suave / branco', 4.5],
  ['#12295A', '#FFFFFF', 'link / branco', 4.5],
  ['#12295A', '#F7F4EE', 'link / papel', 4.5],
  ['#E2C88F', '#0A1D3F', 'foco / azul (3:1)', 3],
  ['#12295A', '#F7F4EE', 'foco / papel (3:1)', 3],
  ['#8A8F9C', '#FFFFFF', 'borda da caixa de seleção (3:1)', 3],
];
let fail = 0;
for (const [fg, bg, uso, min] of pairs) {
  const r = ratio(fg, bg); const ok = r >= min; if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1  (mín ${min})  ${fg} sobre ${bg}  ${uso}`);
}
process.exit(fail ? 1 : 0);
