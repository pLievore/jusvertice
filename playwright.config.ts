import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  // 1 worker: os testes de rolagem/foco medem a página em tempo real e ficam instáveis com a máquina carregada.
  workers: process.env.CI ? 2 : 1,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Usa o Chrome instalado na máquina (sem baixar navegadores do Playwright).
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 }, channel: "chrome" } },
  ],
});
