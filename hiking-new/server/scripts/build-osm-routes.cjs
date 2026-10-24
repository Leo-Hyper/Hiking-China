const fs = require("fs");
const path = require("path");
const {
  downsample,
  simplifyTrack,
} = require("../utils/geo");

const OUTPUT = path.join(__dirname, "../models/osm-routes.json");
const CACHE_DIR = path.join(__dirname, "../data/osm-cache");

const ROUTES = [
  {
    key: "tiger-leaping",
    relationId: 18731549,
    name: "虎跳峡高路徒步",
    region: "云南",
    difficulty: "中级",
    description: "世界十大经典徒步路线，金沙江峡谷震撼体验",
    content: "<p>两天一夜的高路徒步，途经二十八道拐、观音瀑与中峡。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM，仅作路线参考。</p>",
    duration: "2天",
    rating: 4.9,
    image: "/img/虎跳峡.jpg",
    postId: 2,
    tags: "峡谷,经典,云南",
    startPoint: "高路入口",
    endPoint: "中峡",
  },
  {
    key: "tiger-leaping-mid",
    relationId: 18731550,
    name: "中虎跳徒步线",
    region: "云南",
    difficulty: "中级",
    description: "中虎跳峡段落，沿崖壁与栈道下到金沙江边",
    content: "<p>中虎跳峡段落，沿崖壁与栈道下到金沙江边；当前 GPX 为 OSM 关系完整路径。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM。</p>",
    duration: "半天",
    rating: 4.7,
    image: "/img/虎跳峡.jpg",
    postId: 2,
    tags: "峡谷,短线,云南",
    startPoint: "中虎跳徒步入口",
    endPoint: "中虎跳徒步入口",
  },
  {
    key: "yubeng-ice-lake",
    relationId: 19700005,
    name: "雨崩冰湖线",
    region: "云南",
    difficulty: "中级",
    description: "从雨崩上村前往冰湖，穿越高山牧场与原始森林",
    content: "<p>从雨崩上村前往冰湖的单程轨迹；当前 GPX 未包含返程。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM。</p>",
    duration: "1天",
    rating: 4.9,
    image: "/img/雨崩村.webp",
    postId: 6,
    tags: "雪山,冰湖,云南",
    startPoint: "雨崩上村",
    endPoint: "冰湖",
  },
  {
    key: "yubeng-sacred-falls",
    relationId: 19700031,
    name: "雨崩神瀑线",
    region: "云南",
    difficulty: "初级",
    description: "雨崩下村前往神瀑，藏族朝圣路线",
    content: "<p>从雨崩下村沿河谷前往神瀑的单程轨迹；当前 GPX 未包含返程。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM。</p>",
    duration: "半天",
    rating: 4.8,
    image: "/img/雨崩村.webp",
    postId: 6,
    tags: "神瀑,朝圣,云南",
    startPoint: "雨崩下村",
    endPoint: "神瀑",
  },
  {
    key: "yubeng-ninong",
    relationId: 19700085,
    name: "雨崩尼农线",
    region: "云南",
    difficulty: "中级",
    description: "雨崩出山路线，沿尼农峡谷下到澜沧江边",
    content: "<p>从雨崩村经尼农人马驿道出山，峡谷路段需注意落石与湿滑。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM。</p>",
    duration: "1天",
    rating: 4.7,
    image: "/img/雨崩村.webp",
    postId: 6,
    tags: "峡谷,出山,云南",
    startPoint: "雨崩下村",
    endPoint: "尼农村",
    reverse: true,
  },
  {
    key: "huangshan",
    relationId: 18970848,
    name: "黄山徒步",
    region: "安徽",
    difficulty: "初级",
    description: "中国山水之美典范，奇松怪石云海温泉",
    content: "<p>从云谷寺上山，经光明顶、迎客松，感受黄山四绝。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM。</p>",
    duration: "2天",
    rating: 4.6,
    image: "/img/黄山.jpg",
    postId: 9,
    tags: "云海,奇松,安徽",
    startPoint: "云谷寺",
    endPoint: "慈光阁",
  },
  {
    key: "changpingbi",
    relationId: 17822607,
    name: "长坪沟穿越毕棚沟（长穿毕）",
    region: "四川",
    difficulty: "高级",
    description: "四姑娘山长坪沟到毕棚沟的经典重装穿越",
    content: "<p>从长坪沟进入，翻越长坪沟尾的垭口后下到毕棚沟。轨迹来自 OpenStreetMap（ODbL），高程来自 SRTM 30m DEM，仅作路线参考。</p>",
    duration: "3天",
    rating: 4.9,
    image: "/img/四姑娘山.jpg",
    postId: 1,
    tags: "穿越,重装,四川",
    startPoint: "长坪沟",
    endPoint: "毕棚沟",
    reverse: true,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadRelation(relationId) {
  const cachePath = path.join(CACHE_DIR, `${relationId}.json`);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`Missing OSM cache ${cachePath}`);
  }
  return JSON.parse(fs.readFileSync(cachePath, "utf8"));
}

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function assembleRelation(relation) {
  const ways = relation.members
    .filter((member) => member.type === "way" && Array.isArray(member.geometry) && member.geometry.length > 1)
    .map((member) => {
      const points = member.geometry.map((point) => [point.lon, point.lat]);
      if (member.role === "backward") points.reverse();
      return points;
    });

  if (ways.length === 0) throw new Error("Relation has no way geometry");

  let chain = ways.shift();
  while (ways.length > 0) {
    const tail = chain[chain.length - 1];
    let bestIndex = 0;
    let bestReverse = false;
    let bestDistance = Infinity;
    ways.forEach((way, index) => {
      const forward = squaredDistance(tail, way[0]);
      const backward = squaredDistance(tail, way[way.length - 1]);
      if (forward < bestDistance) {
        bestDistance = forward;
        bestIndex = index;
        bestReverse = false;
      }
      if (backward < bestDistance) {
        bestDistance = backward;
        bestIndex = index;
        bestReverse = true;
      }
    });
    const next = ways.splice(bestIndex, 1)[0];
    if (bestReverse) next.reverse();
    chain = chain.concat(next.slice(1));
  }

  return chain.filter((point, index) => {
    if (index === 0) return true;
    return squaredDistance(point, chain[index - 1]) > 0.00000001;
  });
}

async function fetchElevation(points, relationId) {
  const cachePath = path.join(CACHE_DIR, `${relationId}.elev.json`);
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (Array.isArray(cached) && cached.length === points.length) return cached;
  }
  const elevations = new Array(points.length).fill(null);
  for (let start = 0; start < points.length; start += 100) {
    const batch = points.slice(start, start + 100);
    const locations = batch.map(([lng, lat]) => `${lat},${lng}`).join("|");
    const url = `https://api.opentopodata.org/v1/srtm30m?locations=${encodeURIComponent(locations)}`;
    let results = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "HikingChinaRouteImport/1.0" },
        });
        if (response.status === 429 || response.status >= 500) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        const body = await response.json();
        if (body.status !== "OK") throw new Error(`Elevation status ${body.status}`);
        results = body.results;
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await sleep(1500 * (attempt + 1));
      }
    }
    if (!results) throw new Error("Elevation request failed");
    results.forEach((result, index) => {
      const elevation = Number(result.elevation);
      elevations[start + index] = Number.isFinite(elevation) ? elevation : null;
    });
    process.stdout.write(`  elevation ${Math.min(start + 100, points.length)}/${points.length}\r`);
    if (start + 100 < points.length) await sleep(1100);
  }
  process.stdout.write("\n");

  for (let index = 0; index < elevations.length; index += 1) {
    if (elevations[index] != null) continue;
    let before = index - 1;
    while (before >= 0 && elevations[before] == null) before -= 1;
    let after = index + 1;
    while (after < elevations.length && elevations[after] == null) after += 1;
    if (before >= 0 && after < elevations.length) {
      const ratio = (index - before) / (after - before);
      elevations[index] = elevations[before] + (elevations[after] - elevations[before]) * ratio;
    } else if (before >= 0) {
      elevations[index] = elevations[before];
    } else if (after < elevations.length) {
      elevations[index] = elevations[after];
    } else {
      elevations[index] = 0;
    }
  }

  const result = points.map(([lng, lat], index) => [
    Number(lng.toFixed(6)),
    Number(lat.toFixed(6)),
    Math.round(elevations[index]),
  ]);
  fs.writeFileSync(cachePath, JSON.stringify(result), "utf8");
  return result;
}

function smoothElevation(points) {
  const window = points.length < 120 ? 11 : 15;
  const half = Math.floor(window / 2);
  return points.map((point, index) => {
    let total = 0;
    let count = 0;
    const start = Math.max(0, index - half);
    const end = Math.min(points.length - 1, index + half);
    for (let cursor = start; cursor <= end; cursor += 1) {
      total += points[cursor][2];
      count += 1;
    }
    return [point[0], point[1], Math.round(total / count)];
  });
}

async function main() {
  const output = [];
  for (const route of ROUTES) {
    console.log(`\n[OSM] ${route.name} (relation ${route.relationId})`);
    const body = loadRelation(route.relationId);
    const relation = (body.elements || []).find((element) => element.id === route.relationId);
    if (!relation) throw new Error(`Relation ${route.relationId} not found`);

    const raw = assembleRelation(relation);
    const simplified = simplifyTrack(raw, 7);
    const sampled = downsample(simplified, 420);
    console.log(`  points raw=${raw.length} simplified=${simplified.length} sampled=${sampled.length}`);
    const rawWithElevation = await fetchElevation(sampled, route.relationId);
    const oriented = route.reverse ? [...rawWithElevation].reverse() : rawWithElevation;
    const withElevation = smoothElevation(oriented);

    output.push({
      ...route,
      osmRelation: route.relationId,
      dataVersion: 2,
      points: withElevation,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "OpenStreetMap (ODbL) + SRTM 30m via OpenTopoData",
    routes: output,
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${OUTPUT} (${(fs.statSync(OUTPUT).size / 1024).toFixed(0)} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
