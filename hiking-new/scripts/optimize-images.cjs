const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMAGE_DIR = path.join(__dirname, "..", "frontend", "client", "public", "img");
const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

async function main() {
  const files = fs.readdirSync(IMAGE_DIR)
    .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .filter((file) => !file.endsWith(".opt.webp") && !file.endsWith(".card.webp"))
    .filter((file) => path.basename(file).toLowerCase() !== "logo.png");

  let sourceBytes = 0;
  let outputBytes = 0;

  for (const file of files) {
    const sourcePath = path.join(IMAGE_DIR, file);
    const outputPath = path.join(IMAGE_DIR, `${path.parse(file).name}.opt.webp`);
    const cardOutputPath = path.join(IMAGE_DIR, `${path.parse(file).name}.card.webp`);
    const sourceStat = fs.statSync(sourcePath);

    const output = await sharp(sourcePath)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });

    if (output.data.length >= sourceStat.size) {
      console.log(`${file}: skipped (optimized output would be larger)`);
    } else {
      fs.writeFileSync(outputPath, output.data);
      sourceBytes += sourceStat.size;
      outputBytes += output.data.length;
      const reduction = (100 - (output.data.length / sourceStat.size) * 100).toFixed(1);
      console.log(`${file}: ${Math.round(sourceStat.size / 1024)}KB -> ${Math.round(output.data.length / 1024)}KB (${reduction}% smaller)`);
    }

    const cardOutput = await sharp(sourcePath)
      .rotate()
      .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    if (cardOutput.data.length < sourceStat.size) {
      fs.writeFileSync(cardOutputPath, cardOutput.data);
      outputBytes += cardOutput.data.length;
      console.log(`  card: ${Math.round(cardOutput.data.length / 1024)}KB`);
    }
  }

  console.log(`\nTotal: ${(sourceBytes / 1024 / 1024).toFixed(2)}MB -> ${(outputBytes / 1024 / 1024).toFixed(2)}MB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
