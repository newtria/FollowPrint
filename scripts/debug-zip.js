const JSZip = require("jszip");
const fs = require("fs");

const zipPath = process.argv[2];
if (!zipPath) {
  console.log("Usage: node scripts/debug-zip.js <path-to-zip>");
  process.exit(1);
}

const buf = fs.readFileSync(zipPath);
JSZip.loadAsync(buf).then(async (zip) => {
  console.log("=== ZIP FILE LISTING ===\n");
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  paths.forEach((p) => console.log(p));

  console.log(`\n=== TOTAL: ${paths.length} files ===\n`);

  // Show first 500 chars of each JSON file
  for (const p of paths) {
    if (p.endsWith(".json")) {
      const content = await zip.files[p].async("string");
      console.log(`--- ${p} ---`);
      console.log(content.slice(0, 500));
      console.log("...\n");
    }
  }
});
