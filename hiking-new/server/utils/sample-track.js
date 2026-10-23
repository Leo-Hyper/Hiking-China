const { calculateStats, downsample, toLineString } = require("./geo");

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function densify(anchors, rng, options = {}) {
  const steps = Math.max(4, Number(options.pointsPerSegment) || 28);
  const wiggleDegrees = Math.max(0, Number(options.wiggleMeters) || 0) / 111320;
  const phase = Number(options.phase) || 0;
  const points = [];

  for (let segment = 0; segment < anchors.length - 1; segment += 1) {
    const start = anchors[segment];
    const end = anchors[segment + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy) || 1;
    const perpendicularX = -dy / length;
    const perpendicularY = dx / length;

    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const smooth = Math.sin(Math.PI * t);
      const wobble = smooth * (
        (rng() * 2 - 1) * 0.55
        + Math.sin(t * Math.PI * 3 + segment * 1.3 + phase) * 0.45
      );
      const offset = wobble * wiggleDegrees;
      const elevation = start[2] + (end[2] - start[2]) * t
        + Math.sin(t * Math.PI * 3 + segment * 0.8 + phase) * 2.2
        + (rng() * 2 - 1) * 1.8;

      points.push([
        Number((start[0] + dx * t + perpendicularX * offset).toFixed(6)),
        Number((start[1] + dy * t + perpendicularY * offset).toFixed(6)),
        Math.round(elevation),
      ]);
    }
  }

  const last = anchors[anchors.length - 1];
  points.push([last[0], last[1], Math.round(last[2])]);
  return points;
}

function scaleToDistance(points, targetKm, origin) {
  if (!targetKm) return points;
  const stats = calculateStats(points);
  if (!stats.distance || stats.distance <= 0) return points;
  const factor = targetKm / stats.distance;
  if (!Number.isFinite(factor) || factor <= 0) return points;
  return points.map(([lng, lat, elevation]) => [
    Number((origin[0] + (lng - origin[0]) * factor).toFixed(6)),
    Number((origin[1] + (lat - origin[1]) * factor).toFixed(6)),
    elevation,
  ]);
}

function buildSampleTrack(anchors, options = {}) {
  const rng = createRng(Number(options.seed) || 1);
  const forward = densify(anchors, rng, options);
  let points = forward;

  if (options.outAndBack) {
    const returnPoints = densify(
      [...anchors].reverse(),
      rng,
      { ...options, phase: (Number(options.phase) || 0) + 1.7 }
    );
    const offsetLng = 0.000035;
    const offsetLat = 0.000026;
    points = forward.concat(
      returnPoints.slice(1).map(([lng, lat, elevation], index) => [
        Number((lng + offsetLng * Math.sin(index / 18)).toFixed(6)),
        Number((lat + offsetLat * Math.sin(index / 21)).toFixed(6)),
        elevation,
      ])
    );
  }

  points = scaleToDistance(points, options.targetDistanceKm, [anchors[0][0], anchors[0][1]]);
  points = downsample(points, options.maxPoints || 720);

  return {
    points,
    stats: calculateStats(points),
    geojson: toLineString(points),
  };
}

module.exports = { buildSampleTrack };
