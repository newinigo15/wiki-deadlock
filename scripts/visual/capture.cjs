// Capturas de regresión visual (issue #3).
// Uso: NODE_PATH=<dir con playwright>/node_modules node scripts/visual/capture.cjs <baseUrl> <carpetaSalida>
// Ej.:  node scripts/visual/capture.cjs http://localhost:3123 visual/baseline-b644219
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = process.argv[3] || "visual/current";
const ROUTES = ["/", "/heroes", "/heroes/haze", "/guias/como-hacer-parry", "/builds", "/mapa", "/comunidad", "/entrar"];
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
const slug = (r) => (r === "/" ? "home" : r.slice(1).replace(/\//g, "_"));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const log = [];
  for (const [vp, opts] of Object.entries(VIEWPORTS)) {
    // reducedMotion: congela transiciones CSS (globals.css) para que las capturas sean estables.
    const ctx = await browser.newContext({ ...opts, deviceScaleFactor: 1, reducedMotion: "reduce", locale: "es-ES" });
    for (const r of ROUTES) {
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(2500); // visor 3D / escenas de fondo
      const canvases = await page.locator("canvas").count();
      const file = `${vp}__${slug(r)}.png`;
      await page.screenshot({ path: path.join(OUT, file), fullPage: true, animations: "disabled" });
      // Primer pliegue aparte: es donde viven el visor 3D y la escena de fondo.
      await page.screenshot({ path: path.join(OUT, `${vp}__${slug(r)}__fold.png`), animations: "disabled" });
      if (vp === "mobile" && r === "/") {
        await page.getByRole("button", { name: "Menú" }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, "mobile__nav-abierta.png"), animations: "disabled" });
      }
      log.push({ vp, route: r, status: res && res.status(), canvases, errors });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "capture-log.json"), JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log));
})();
