const EARTH_RADIUS_KM = 6371.0088;

function isFinitePoint(point) {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(Number(point[0]))
    && Number.isFinite(Number(point[1]));
}

function normalizePoint(point) {
  const elevation = point[2] == null || point[2] === "" ? null : Number(point[2]);
  return [
    Number(point[0]),
    Number(point[1]),
    Number.isFinite(elevation) ? elevation : null,
  ];
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRadians(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function calculateStats(inputPoints) {
  const points = (inputPoints || []).filter(isFinitePoint).map(normalizePoint);
  let distance = 0;
  let ascent = 0;
  let descent = 0;
  let minElevation = null;
  let maxElevation = null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (index > 0) {
      const previous = points[index - 1];
      distance += haversineKm(previous, point);
      if (previous[2] != null && point[2] != null) {
        const delta = point[2] - previous[2];
        if (delta > 3) ascent += delta;
        if (delta < -3) descent += Math.abs(delta);
      }
    }
    if (point[2] != null) {
      minElevation = minElevation == null ? point[2] : Math.min(minElevation, point[2]);
      maxElevation = maxElevation == null ? point[2] : Math.max(maxElevation, point[2]);
    }
  }

  return {
    distance: Math.round(distance * 100) / 100,
    ascentM: Math.round(ascent),
    descentM: Math.round(descent),
    minElevation: minElevation == null ? null : Math.round(minElevation),
    maxElevation: maxElevation == null ? null : Math.round(maxElevation),
    pointCount: points.length,
  };
}

function getSqSegDist(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyStep(points, first, last, sqTolerance, simplified) {
  let maxSqDistance = sqTolerance;
  let index = -1;

  for (let current = first + 1; current < last; current += 1) {
    const sqDistance = getSqSegDist(points[current], points[first], points[last]);
    if (sqDistance > maxSqDistance) {
      index = current;
      maxSqDistance = sqDistance;
    }
  }

  if (index > -1) {
    if (index - first > 1) simplifyStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyStep(points, index, last, sqTolerance, simplified);
  }
}

function simplifyTrack(inputPoints, toleranceMeters = 5) {
  const points = (inputPoints || []).filter(isFinitePoint).map(normalizePoint);
  if (points.length <= 2) return points;

  const toleranceDegrees = Math.max(toleranceMeters, 1) / 111320;
  const simplified = [points[0]];
  simplifyStep(points, 0, points.length - 1, toleranceDegrees ** 2, simplified);
  simplified.push(points[points.length - 1]);
  return simplified;
}

function downsample(points, maxPoints = 500) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points || [];
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
}

function toLineString(points) {
  return {
    type: "LineString",
    coordinates: (points || []).filter(isFinitePoint).map(normalizePoint),
  };
}

function fromGeoJson(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("轨迹数据格式无效");
    }
  }
  if (!parsed || parsed.type !== "LineString" || !Array.isArray(parsed.coordinates)) {
    throw new Error("轨迹数据必须是 GeoJSON LineString");
  }
  const points = parsed.coordinates.filter(isFinitePoint).map(normalizePoint);
  if (points.length < 2) throw new Error("轨迹至少需要两个有效坐标点");
  return points;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pointsToGpx(inputPoints, name = "Hiking China Route") {
  const points = (inputPoints || []).filter(isFinitePoint).map(normalizePoint);
  const trackPoints = points.map((point) => {
    const elevation = point[2] == null ? "" : `<ele>${point[2]}</ele>`;
    return `<trkpt lat="${point[1]}" lon="${point[0]}">${elevation}</trkpt>`;
  }).join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Hiking China" xmlns="http://www.topografix.com/GPX/1/1">',
    `<trk><name>${escapeXml(name)}</name><trkseg>${trackPoints}</trkseg></trk>`,
    "</gpx>",
  ].join("");
}

function validatePoints(points, { maxPoints = 50000 } = {}) {
  const valid = (points || []).filter(isFinitePoint).map(normalizePoint);
  if (valid.length < 2) throw new Error("轨迹至少需要两个有效坐标点");
  if (valid.length > maxPoints) throw new Error(`轨迹点过多，最多支持 ${maxPoints} 个点`);
  for (const point of valid) {
    if (point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90) {
      throw new Error("轨迹包含无效的经纬度");
    }
    if (point[2] != null && (point[2] < -500 || point[2] > 9000)) {
      throw new Error("轨迹包含异常海拔值");
    }
  }
  return valid;
}

module.exports = {
  calculateStats,
  downsample,
  fromGeoJson,
  pointsToGpx,
  simplifyTrack,
  toLineString,
  validatePoints,
};
