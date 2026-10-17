// Detalha o LCP (elemento e fases) e os deslocamentos de layout (CLS) no perfil celular.
// Uso: node scripts/lighthouse-detalhe.mjs [url]
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const url = process.argv[2] ?? "http://localhost:3100";
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
try {
  const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" });
  const a = lhr.audits;
  console.log("LCP", a["largest-contentful-paint"].displayValue, "| CLS", a["cumulative-layout-shift"].displayValue);
  const andar = (o, f, d = 0) => {
    if (!o || d > 6) return;
    if (Array.isArray(o)) return o.forEach((x) => andar(x, f, d + 1));
    if (typeof o === "object") {
      f(o);
      Object.values(o).forEach((v) => andar(v, f, d + 1));
    }
  };
  console.log("\n## LCP");
  andar(a["lcp-breakdown-insight"]?.details, (o) => {
    if (o.snippet) console.log("  elemento:", o.snippet.slice(0, 180));
    if (o.label && typeof o.duration === "number") console.log(`  ${o.label}: ${Math.round(o.duration)} ms`);
  });
  console.log("\n## Deslocamentos (CLS)");
  andar(a["cls-culprits-insight"]?.details ?? a["layout-shifts"]?.details, (o) => {
    if (o.snippet) console.log("  ", o.snippet.slice(0, 180));
    if (typeof o.score === "number") console.log("     score", o.score.toFixed(3));
  });
} finally {
  await chrome.kill();
}
