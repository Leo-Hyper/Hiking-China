const express = require("express");
const router = express.Router();
const { all } = require("../models/db");
const { getAppBaseUrl } = require("../utils/app-url");

const BASE_URL = getAppBaseUrl();

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(path, lastmod, priority = "0.6") {
  return `<url><loc>${escapeXml(BASE_URL + path)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}<priority>${priority}</priority></url>`;
}

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const [posts, events, users] = await Promise.all([
      all("SELECT id, updated_at FROM posts WHERE status = 1 ORDER BY updated_at DESC LIMIT 5000"),
      all("SELECT id, updated_at FROM events WHERE status = 'active' ORDER BY updated_at DESC LIMIT 2000"),
      all("SELECT id, updated_at FROM users WHERE profile_public = 1 AND account_status = 'active' ORDER BY updated_at DESC LIMIT 2000"),
    ]);

    const staticEntries = [
      urlEntry("/", null, "1.0"),
      urlEntry("/routes", null, "0.9"),
      urlEntry("/gear", null, "0.8"),
      urlEntry("/events", null, "0.8"),
      urlEntry("/forum", null, "0.8"),
      urlEntry("/privacy", null, "0.3"),
      urlEntry("/terms", null, "0.3"),
      urlEntry("/community-guidelines", null, "0.3"),
      urlEntry("/disclaimer", null, "0.3"),
      urlEntry("/copyright", null, "0.3"),
      urlEntry("/contact", null, "0.3"),
    ];
    const postEntries = posts.map((post) => urlEntry(`/post/${post.id}`, post.updated_at, "0.7"));
    const eventEntries = events.map((event) => urlEntry(`/events/${event.id}`, event.updated_at, "0.7"));
    const userEntries = users.map((user) => urlEntry(`/user/${user.id}`, user.updated_at, "0.5"));

    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
      .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticEntries, ...postEntries, ...eventEntries, ...userEntries].join("")}</urlset>`);
  } catch (error) {
    console.error("[SITEMAP] failed:", error);
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
});

module.exports = router;
