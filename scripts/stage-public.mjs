import fs from "node:fs";
import path from "node:path";

/**
 * Stages ONLY published episodes' code & frames from content/ into public/
 * right before `next build` (static export for GitHub Pages).
 * Pending episodes stay completely out of public/ and out/.
 */
const root = process.cwd();
const expFile = fs.readFileSync(path.join(root, "src/data/experiments.ts"), "utf8");

// Match each episode object's `ep` and `releaseAt`
const blocks = expFile.split(/\{\s*\n\s*slug:/).slice(1);
const now = Date.now();

const pubCodeDir = path.join(root, "public/code");
const pubFramesDir = path.join(root, "public/frames");
fs.rmSync(pubCodeDir, { recursive: true, force: true });
fs.rmSync(pubFramesDir, { recursive: true, force: true });
fs.mkdirSync(pubCodeDir, { recursive: true });
fs.mkdirSync(pubFramesDir, { recursive: true });
fs.writeFileSync(path.join(root, "public/.nojekyll"), "");

const published = [];
const pending = [];

for (const block of blocks) {
  const epMatch = block.match(/\bep:\s*(\d+)/);
  const relMatch = block.match(/\breleaseAt:\s*(?:"([^"]+)"|null)/);
  if (!epMatch) continue;
  const ep = Number(epMatch[1]);
  const releaseAt = relMatch?.[1] ?? null;
  const pad = String(ep).padStart(2, "0");

  if (releaseAt && Date.parse(releaseAt) <= now) {
    const srcCode = path.join(root, `content/code/ep${pad}.sim.js`);
    const dstCode = path.join(pubCodeDir, `ep${pad}.sim.js`);
    if (fs.existsSync(srcCode)) fs.copyFileSync(srcCode, dstCode);

    const srcFrames = path.join(root, `content/frames/ep${pad}`);
    const dstFrames = path.join(pubFramesDir, `ep${pad}`);
    if (fs.existsSync(srcFrames)) {
      fs.cpSync(srcFrames, dstFrames, { recursive: true });
    }
    published.push(`ep${pad}`);
  } else {
    pending.push(`ep${pad}`);
  }
}

console.log(
  `[stage-public] Published (${published.length}): ${published.join(", ") || "none"} | Held back (${pending.length}): ${pending.join(", ") || "none"}`
);
