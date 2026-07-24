import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tutorialIds = [
  "aviator-basique",
  "aviator-pro",
  "aviator-premium",
  "cosmox",
  "jetx",
  "virtuel-football",
  "penalty-shootout",
  "studio-spribe",
];

// Get which tutorial to render from CLI arg, or render all
const targetId = process.argv[2];
const toRender = targetId ? [targetId] : tutorialIds;

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

for (const id of toRender) {
  console.log(`Rendering ${id}...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id,
    puppeteerInstance: browser,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: `/mnt/documents/tutorial-${id}.mp4`,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });
  console.log(`✅ Done: tutorial-${id}.mp4`);
}

await browser.close({ silent: false });
console.log("All done!");
