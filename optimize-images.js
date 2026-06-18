const sharp = require("./hiking-new/node_modules/sharp");
const fs = require("fs");
const path = require("path");

const imgDir = "D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/public/img";
const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f));

let totalOriginal = 0;
let totalCompressed = 0;
const results = [];

async function compress(file) {
  const input = path.join(imgDir, file);
  const stat = fs.statSync(input);
  totalOriginal += stat.size;

  const ext = path.extname(file).toLowerCase();
  let buffer;

  try {
    if (ext === ".webp" || ext === ".avif") {
      buffer = await sharp(input).resize(1920, 1080, { withoutEnlargement: true }).toBuffer();
    } else if (ext === ".png") {
      buffer = await sharp(input).resize(1920, 1080, { withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
    } else {
      buffer = await sharp(input).resize(1920, 1080, { withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    }

    fs.writeFileSync(input, buffer);
    totalCompressed += buffer.length;
    const saved = ((stat.size - buffer.length) / stat.size * 100).toFixed(1);
    results.push({ file, original: stat.size, compressed: buffer.length, saved });
  } catch (err) {
    results.push({ file, error: err.message });
    console.error(`Failed ${file}: ${err.message}`);
  }
}

(async () => {
  for (const f of files) {
    await compress(f);
  }
  console.log("\n=== Results ===");
  results.forEach(r => {
    if (r.error) console.log(`  ${r.file}: ERROR - ${r.error}`);
    else console.log(`  ${r.file}: ${r.original} → ${r.compressed} (-${r.saved}%)`);
  });
  console.log(`\nTotal: ${(totalOriginal/1024/1024).toFixed(2)}MB → ${(totalCompressed/1024/1024).toFixed(2)}MB (-${((totalOriginal-totalCompressed)/totalOriginal*100).toFixed(1)}%)`);
})();
