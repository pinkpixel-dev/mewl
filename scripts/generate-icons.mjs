import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const repoRoot = process.cwd();
const sourceIconPath = path.join(repoRoot, "public", "icon.png");
const buildRoot = path.join(repoRoot, "build", "icons");
const pngOutputDir = path.join(buildRoot, "png");
const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const icoSizes = [16, 24, 32, 48, 64, 128, 256];

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function generatePngSizes() {
  const image = sharp(sourceIconPath).png();

  await Promise.all(
    sizes.map(async (size) => {
      const outputPath = path.join(pngOutputDir, `${size}x${size}.png`);
      await image
        .clone()
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(outputPath);
    }),
  );
}

async function generateWindowsIcon() {
  const icoInputPaths = icoSizes.map((size) => path.join(pngOutputDir, `${size}x${size}.png`));
  const icoBuffer = await pngToIco(icoInputPaths);
  await fs.writeFile(path.join(buildRoot, "icon.ico"), icoBuffer);
}

async function generateRootPng() {
  await sharp(sourceIconPath)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(buildRoot, "icon.png"));
}

async function main() {
  await ensureDirectory(pngOutputDir);
  await generatePngSizes();
  await generateRootPng();
  await generateWindowsIcon();
  console.log("Generated Linux packaging icons in build/icons and build/icons/png.");
}

await main();
