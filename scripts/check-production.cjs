const SITE = process.env.SITE_URL || "https://hiking-china.onrender.com";
const API = process.env.API_URL || "https://hiking-china-api-sg.onrender.com";

async function check(name, url, validate) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const body = await response.text();
    const result = validate(response, body);
    console.log(`${result.ok ? "PASS" : "FAIL"} ${name} (${response.status})${result.detail ? ` - ${result.detail}` : ""}`);
    return result.ok;
  } catch (error) {
    console.log(`FAIL ${name} - ${error.message}`);
    return false;
  }
}

async function main() {
  const results = [];

  results.push(await check("homepage", SITE, (response) => ({
    ok: response.ok,
    detail: response.headers.get("server") || "",
  })));

  results.push(await check("api health", `${API}/api/health`, (response, body) => {
    let data = {};
    try { data = JSON.parse(body); } catch (error) { /* ignore */ }
    return {
      ok: response.ok && data.status === "ok" && data.database === "ok",
      detail: `database=${data.database || "unknown"}`,
    };
  }));

  results.push(await check("sitemap", `${API}/sitemap.xml`, (response) => ({
    ok: response.ok,
    detail: response.headers.get("content-type") || "",
  })));

  const headersResponse = await fetch(SITE, { method: "HEAD", redirect: "follow" });
  const requiredHeaders = [
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
    "content-security-policy",
  ];
  for (const header of requiredHeaders) {
    const value = headersResponse.headers.get(header);
    console.log(`${value ? "PASS" : "WARN"} header ${header}${value ? "" : " - missing"}`);
  }

  const homeResponse = await fetch(SITE);
  const homeCache = homeResponse.headers.get("cache-control") || "";
  console.log(`${homeCache.includes("no-cache") ? "PASS" : "WARN"} home cache-control${homeCache ? ` - ${homeCache}` : " - missing"}`);

  const assetPath = ((await homeResponse.text()).match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
  if (assetPath) {
    const assetResponse = await fetch(new URL(assetPath, SITE), { method: "HEAD" });
    const assetCache = assetResponse.headers.get("cache-control") || "";
    console.log(`${assetCache.includes("immutable") ? "PASS" : "WARN"} asset cache-control${assetCache ? ` - ${assetCache}` : " - missing"}`);
  } else {
    console.log("WARN asset cache-control - bundle not referenced in HTML");
  }

  const imageResponse = await fetch(new URL("/img/routes/huangshan.card.webp", SITE), { method: "HEAD" });
  const imageCache = imageResponse.headers.get("cache-control") || "";
  console.log(`${imageCache.includes("max-age=2592000") ? "PASS" : "WARN"} image cache-control${imageCache ? ` - ${imageCache}` : " - missing"}`);

  const failed = results.filter((ok) => !ok).length;
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll core checks passed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
