const express = require("express");
const { authMiddleware, requireVerifiedEmail } = require("../middleware/auth");
const { publicCache, clearPublicCache } = require("../middleware/public-cache");
const routeModel = require("../models/route");
const postModel = require("../models/post");
const { parseGpx } = require("../utils/gpx");
const {
  calculateStats,
  downsample,
  fromGeoJson,
  pointsToGpx,
  simplifyTrack,
  toLineString,
  validatePoints,
} = require("../utils/geo");

const router = express.Router();
const gpxBody = express.text({
  type: ["text/plain", "application/gpx+xml", "application/xml", "text/xml"],
  limit: "10mb",
});

function canManage(route, user) {
  if (!route || !user) return false;
  if (user.role === "admin") return true;
  return route.user_id != null && Number(route.user_id) === Number(user.id);
}

function withTrackData(input) {
  const data = { ...input };
  if (!data.geojson && !data.points) return data;

  const points = data.geojson ? fromGeoJson(data.geojson) : validatePoints(data.points);
  const simplified = simplifyTrack(points, 5);
  const stats = calculateStats(simplified);

  return {
    ...data,
    geojson: toLineString(simplified),
    distance: stats.distance,
    ascentM: stats.ascentM,
    descentM: stats.descentM,
    minElevation: stats.minElevation,
    maxElevation: stats.maxElevation,
    pointCount: stats.pointCount,
  };
}

// GET /api/routes?region=&difficulty=&distance=&sort=
router.get("/", publicCache(30000), async (req, res) => {
  try {
    const routes = await routeModel.listRoutes({
      region: req.query.region,
      difficulty: req.query.difficulty,
      distance: req.query.distance,
      sort: req.query.sort,
    });
    res.json({ routes });
  } catch (error) {
    console.error("[ROUTES] list failed:", error);
    res.status(500).json({ error: "路线加载失败" });
  }
});

// GET /api/routes/favorites
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const routes = await routeModel.listFavoriteRoutes(req.userId);
    res.json({ routes });
  } catch (error) {
    console.error("[ROUTES] favorites failed:", error);
    res.status(500).json({ error: "收藏加载失败" });
  }
});

// GET /api/routes/companions/summary?days=30
router.get("/companions/summary", publicCache(30000), async (req, res) => {
  try {
    const summary = await routeModel.getCompanionSummary(req.query.days);
    res.json(summary);
  } catch (error) {
    console.error("[ROUTES] companion summary failed:", error);
    res.status(500).json({ error: "结伴数据加载失败" });
  }
});

// POST /api/routes/parse-gpx  (text/plain GPX body)
router.post("/parse-gpx", authMiddleware, requireVerifiedEmail, gpxBody, async (req, res) => {
  try {
    const raw = typeof req.body === "string" ? req.body : req.body?.gpx;
    if (!raw) return res.status(400).json({ error: "请上传 GPX 内容" });

    const parsed = parseGpx(raw);
    const simplified = simplifyTrack(parsed.points, 5);
    const stats = calculateStats(simplified);

    res.json({
      name: parsed.name,
      geojson: toLineString(simplified),
      points: downsample(simplified, 500),
      stats,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "GPX 解析失败" });
  }
});

// GET /api/routes/:id/export.gpx
router.get("/:id/export.gpx", async (req, res) => {
  try {
    const route = await routeModel.getRouteById(Number(req.params.id));
    if (!route) return res.status(404).json({ error: "路线不存在" });

    const points = route.geojson ? fromGeoJson(route.geojson) : [];
    if (points.length < 2) return res.status(404).json({ error: "该路线暂无轨迹数据" });

    res.set("Content-Type", "application/gpx+xml; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="route-${route.id}.gpx"`);
    const exportName = route.is_sample ? `${route.name}（示例轨迹，非实测）` : route.name;
    res.send(pointsToGpx(points, exportName));
  } catch (error) {
    console.error("[ROUTES] export failed:", error);
    res.status(500).json({ error: "GPX 导出失败" });
  }
});

// GET /api/routes/:id/favorite
router.get("/:id/favorite", authMiddleware, async (req, res) => {
  try {
    const favorited = await routeModel.isFavorite(req.userId, Number(req.params.id));
    res.json({ favorited });
  } catch (error) {
    console.error("[ROUTES] favorite check failed:", error);
    res.status(500).json({ error: "收藏状态加载失败" });
  }
});

// GET /api/routes/:id/posts - 关联到该路线的游记
router.get("/:id/posts", publicCache(30000), async (req, res) => {
  try {
    const routeId = Number(req.params.id);
    const route = await routeModel.getRouteById(routeId);
    if (!route) return res.status(404).json({ error: "路线不存在" });

    const posts = await postModel.getPostsByRouteId(routeId, 6);
    if (route.post_id && !posts.some((post) => Number(post.id) === Number(route.post_id))) {
      const legacyPosts = await postModel.getPostsByIds([Number(route.post_id)]);
      posts.push(...legacyPosts);
    }
    res.json({ posts });
  } catch (error) {
    console.error("[ROUTES] related posts failed:", error);
    res.status(500).json({ error: "相关游记加载失败" });
  }
});

// GET /api/routes/:id
router.get("/:id", async (req, res) => {
  try {
    const route = await routeModel.getRouteById(Number(req.params.id));
    if (!route) return res.status(404).json({ error: "路线不存在" });
    res.json({ route });
  } catch (error) {
    console.error("[ROUTES] detail failed:", error);
    res.status(500).json({ error: "路线加载失败" });
  }
});

// POST /api/routes
router.post("/", authMiddleware, requireVerifiedEmail, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "路线名称需为 2-100 个字符" });
    }

    const data = withTrackData(req.body || {});
    const created = await routeModel.createRoute(req.userId, { ...data, name });
    clearPublicCache();
    const route = await routeModel.getRouteById(created.id);
    res.status(201).json({ route });
  } catch (error) {
    console.error("[ROUTES] create failed:", error);
    res.status(400).json({ error: error.message || "路线创建失败" });
  }
});

// PUT /api/routes/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await routeModel.getRouteRow(id);
    if (!existing) return res.status(404).json({ error: "路线不存在" });
    if (!canManage(existing, req.user)) return res.status(403).json({ error: "无权编辑该路线" });

    const data = withTrackData(req.body || {});
    await routeModel.updateRoute(id, data);
    clearPublicCache();
    const route = await routeModel.getRouteById(id);
    res.json({ route });
  } catch (error) {
    console.error("[ROUTES] update failed:", error);
    res.status(400).json({ error: error.message || "路线更新失败" });
  }
});

// DELETE /api/routes/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await routeModel.getRouteRow(id);
    if (!existing) return res.status(404).json({ error: "路线不存在" });
    if (!canManage(existing, req.user)) return res.status(403).json({ error: "无权删除该路线" });

    await routeModel.deleteRoute(id);
    clearPublicCache();
    res.json({ message: "路线已删除" });
  } catch (error) {
    console.error("[ROUTES] delete failed:", error);
    res.status(500).json({ error: "路线删除失败" });
  }
});

// POST /api/routes/:id/favorite
router.post("/:id/favorite", authMiddleware, async (req, res) => {
  try {
    const route = await routeModel.getRouteById(Number(req.params.id));
    if (!route) return res.status(404).json({ error: "路线不存在" });

    const result = await routeModel.toggleFavorite(req.userId, route.id);
    clearPublicCache();
    res.json(result);
  } catch (error) {
    console.error("[ROUTES] favorite toggle failed:", error);
    res.status(500).json({ error: "收藏操作失败" });
  }
});

module.exports = router;
