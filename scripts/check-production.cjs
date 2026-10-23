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
