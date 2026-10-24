const { all, get, run } = require("./db");

function normalizeRoute(row) {
  if (!row) return null;
  let geojson = null;
  if (row.geojson) {
    try {
      geojson = typeof row.geojson === "string" ? JSON.parse(row.geojson) : row.geojson;
    } catch {
      geojson = null;
    }
  }
  return {
    ...row,
    geojson,
    tags: String(row.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    distance: Number(row.distance || 0),
    rating: Number(row.rating || 0),
    ascent_m: row.ascent_m == null ? null : Number(row.ascent_m),
    descent_m: row.descent_m == null ? null : Number(row.descent_m),
    min_elevation: row.min_elevation == null ? null : Number(row.min_elevation),
    max_elevation: row.max_elevation == null ? null : Number(row.max_elevation),
    point_count: Number(row.point_count || 0),
    favorite_count: Number(row.favorite_count || 0),
    is_sample: Number(row.is_sample || 0) === 1,
    data_source: String(row.data_source || ""),
    data_version: Number(row.data_version || 0),
  };
}

function buildWhere(filters = {}) {
  const clauses = ["r.status = 1"];
  const params = [];

  if (filters.region) {
    clauses.push("r.region = ?");
    params.push(String(filters.region));
  }
  if (filters.difficulty) {
    clauses.push("r.difficulty = ?");
    params.push(String(filters.difficulty));
  }
  if (filters.distance === "short") clauses.push("r.distance < 10");
  if (filters.distance === "medium") clauses.push("r.distance >= 10 AND r.distance <= 20");
  if (filters.distance === "long") clauses.push("r.distance > 20");

  return { where: clauses.join(" AND "), params };
}

function orderBy(sort) {
  if (sort === "distanceAsc") return "r.distance ASC, r.id ASC";
  if (sort === "distanceDesc") return "r.distance DESC, r.id ASC";
  if (sort === "rating") return "r.rating DESC, r.id ASC";
  return "r.rating DESC, r.id ASC";
}

async function listRoutes(filters = {}) {
  const { where, params } = buildWhere(filters);
  const rows = await all(
    `SELECT r.*,
      (SELECT COUNT(*) FROM route_favorites f WHERE f.route_id = r.id) AS favorite_count
     FROM routes r
     WHERE ${where}
     ORDER BY ${orderBy(filters.sort)}`,
    params
  );
  return (rows || []).map(normalizeRoute);
}

async function countRoutes() {
  const row = await get("SELECT COUNT(*) AS count FROM routes WHERE status = 1");
  return Number(row?.count || 0);
}

async function getCompanionSummary(days = 30) {
  const windowDays = Math.max(1, Math.min(365, Number(days) || 30));
  const row = await get(
    `SELECT
       COUNT(*) AS post_count,
       COUNT(DISTINCT p.user_id) AS user_count
     FROM posts p
     WHERE p.status = 1
       AND p.created_at >= datetime('now', ?)
       AND (
         p.title LIKE '%结伴%'
         OR p.tags LIKE '%结伴%'
         OR p.content LIKE '%结伴%'
         OR p.title LIKE '%搭子%'
         OR p.tags LIKE '%搭子%'
         OR p.content LIKE '%搭子%'
         OR p.title LIKE '%同行%'
         OR p.tags LIKE '%同行%'
       )`,
    [`-${windowDays} days`]
  );
  return {
    days: windowDays,
    posts: Number(row?.post_count || 0),
    users: Number(row?.user_count || 0),
  };
}

async function getRouteById(id) {
  const row = await get(
    `SELECT r.*,
      (SELECT COUNT(*) FROM route_favorites f WHERE f.route_id = r.id) AS favorite_count
     FROM routes r
     WHERE r.id = ? AND r.status = 1`,
    [id]
  );
  return normalizeRoute(row);
}

async function getRouteRow(id) {
  return get("SELECT * FROM routes WHERE id = ?", [id]) || null;
}

async function createRoute(userId, data = {}) {
  const result = await run(
    `INSERT INTO routes (
      user_id, name, region, difficulty, description, content, distance, duration,
      rating, image, post_id, tags, geojson, ascent_m, descent_m,
      min_elevation, max_elevation, start_point, end_point, point_count,
      data_source, data_version, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      userId,
      String(data.name || "").trim(),
      String(data.region || "").trim(),
      String(data.difficulty || "初级"),
      String(data.description || ""),
      String(data.content || ""),
      Number(data.distance || 0),
      String(data.duration || ""),
      Number(data.rating || 4.5),
      String(data.image || ""),
      data.postId == null ? null : Number(data.postId),
      Array.isArray(data.tags) ? data.tags.join(",") : String(data.tags || ""),
      data.geojson ? JSON.stringify(data.geojson) : "",
      data.ascentM == null ? null : Number(data.ascentM),
      data.descentM == null ? null : Number(data.descentM),
      data.minElevation == null ? null : Number(data.minElevation),
      data.maxElevation == null ? null : Number(data.maxElevation),
      String(data.startPoint || ""),
      String(data.endPoint || ""),
      Number(data.pointCount || 0),
      data.geojson ? "gpx" : "",
      data.geojson ? 1 : 0,
    ]
  );
  return { id: Number(result.lastInsertRowid) };
}

const UPDATE_FIELDS = {
  name: "name",
  region: "region",
  difficulty: "difficulty",
  description: "description",
  content: "content",
  distance: "distance",
  duration: "duration",
  rating: "rating",
  image: "image",
  postId: "post_id",
  tags: "tags",
  geojson: "geojson",
  ascentM: "ascent_m",
  descentM: "descent_m",
  minElevation: "min_elevation",
  maxElevation: "max_elevation",
  startPoint: "start_point",
  endPoint: "end_point",
  pointCount: "point_count",
};

async function updateRoute(id, data = {}) {
  const sets = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATE_FIELDS)) {
    if (data[key] === undefined) continue;
    let value = data[key];
    if (key === "tags" && Array.isArray(value)) value = value.join(",");
    if (key === "geojson" && value && typeof value !== "string") value = JSON.stringify(value);
    if (key === "geojson" && value) {
      sets.push("data_source = 'gpx'");
      sets.push("is_sample = 0");
      sets.push("sample_version = 2");
    }
    sets.push(`${column} = ?`);
    params.push(value);
  }

  if (sets.length === 0) return { changes: 0 };
  sets.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const result = await run(
    `UPDATE routes SET ${sets.join(", ")} WHERE id = ?`,
    params
  );
  return { changes: Number(result.changes || 0) };
}

async function deleteRoute(id) {
  await run("DELETE FROM route_favorites WHERE route_id = ?", [id]);
  const result = await run("DELETE FROM routes WHERE id = ?", [id]);
  return { changes: Number(result.changes || 0) };
}

async function isFavorite(userId, routeId) {
  const row = await get(
    "SELECT id FROM route_favorites WHERE user_id = ? AND route_id = ?",
    [userId, routeId]
  );
  return Boolean(row);
}

async function toggleFavorite(userId, routeId) {
  const favorite = await isFavorite(userId, routeId);
  if (favorite) {
    await run(
      "DELETE FROM route_favorites WHERE user_id = ? AND route_id = ?",
      [userId, routeId]
    );
    return { favorited: false };
  }
  await run(
    "INSERT INTO route_favorites (user_id, route_id) VALUES (?, ?)",
    [userId, routeId]
  );
  return { favorited: true };
}

async function listFavoriteRoutes(userId) {
  const rows = await all(
    `SELECT r.*,
      (SELECT COUNT(*) FROM route_favorites f WHERE f.route_id = r.id) AS favorite_count
     FROM route_favorites rf
     JOIN routes r ON r.id = rf.route_id
     WHERE rf.user_id = ? AND r.status = 1
     ORDER BY rf.created_at DESC`,
    [userId]
  );
  return (rows || []).map(normalizeRoute);
}

module.exports = {
  countRoutes,
  createRoute,
  deleteRoute,
  getCompanionSummary,
  getRouteById,
  getRouteRow,
  isFavorite,
  listFavoriteRoutes,
  listRoutes,
  normalizeRoute,
  toggleFavorite,
  updateRoute,
};
