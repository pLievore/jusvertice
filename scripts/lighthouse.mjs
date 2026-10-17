// Lighthouse no perfil celular (padrão: Moto G Power + 4G lento), usando o Chrome instalado.
// Uso: node scripts/lighthouse.mjs [url] [desktop]
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const url = process.argv[2] ?? "http://localhost:3100";
const desktop = process.argv[3] === "desktop";

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
try {
  const config = desktop ? (await import("lighthouse/core/config/desktop-config.js")).default : undefined;
  const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" }, config);
  const cats = Object.values(lhr.categories).map((c) => `${c.title.padEnd(16)} ${Math.round(c.score * 100)}`);
  const m = lhr.audits;
  console.log(`\n${desktop ? "DESKTOP" : "CELULAR"} — ${url}\n`);
  console.log(cats.join("\n"));
  console.log("\nLCP ", m["largest-contentful-paint"].displayValue);
  console.log("FCP ", m["first-contentful-paint"].displayValue);
  console.log("TBT ", m["total-blocking-time"].displayValue);
  console.log("CLS ", m["cumulative-layout-shift"].displayValue);
  console.log("SI  ", m["speed-index"].displayValue);
  const falhas = Object.values(m).filter(
    (a) => a.score !== null && a.score < 0.9 && ["binary", "numeric", "metricSavings"].includes(a.scoreDisplayMode) && a.details?.type !== "debugdata",
  );
  if (falhas.length) {
    console.log("\nAuditorias abaixo de 90:");
    for (const a of falhas) console.log(` - ${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
  }
} finally {
  await chrome.kill();
}
