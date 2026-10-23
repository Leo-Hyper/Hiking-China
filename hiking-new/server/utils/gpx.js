const { XMLParser } = require("fast-xml-parser");
const { validatePoints } = require("./geo");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (name) => ["trk", "trkseg", "trkpt", "rte", "rtept", "wpt"].includes(name),
});

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function textValue(value) {
  if (value == null) return "";
  if (typeof value === "object" && "#text" in value) return String(value["#text"]);
  return String(value);
}

function readPoint(point) {
  const latitude = Number(point?.["@_lat"]);
  const longitude = Number(point?.["@_lon"]);
  const elevationRaw = point?.ele;
  const elevation = elevationRaw == null ? null : Number(textValue(elevationRaw));
  return [
    longitude,
    latitude,
    Number.isFinite(elevation) ? elevation : null,
  ];
}

function parseGpx(xml) {
  if (typeof xml !== "string" || !xml.trim()) {
    throw new Error("GPX 内容为空");
  }

  let document;
  try {
    document = parser.parse(xml);
  } catch {
    throw new Error("GPX 解析失败，请检查文件格式");
  }

  const root = document?.gpx;
  if (!root) throw new Error("不是有效的 GPX 文件");

  const points = [];
  for (const track of asArray(root.trk)) {
    for (const segment of asArray(track.trkseg)) {
      for (const point of asArray(segment.trkpt)) points.push(readPoint(point));
    }
  }

  if (points.length === 0) {
    for (const route of asArray(root.rte)) {
      for (const point of asArray(route.rtept)) points.push(readPoint(point));
    }
  }

  if (points.length === 0) {
    for (const point of asArray(root.wpt)) points.push(readPoint(point));
  }

  const validPoints = validatePoints(points);
  const name = textValue(root?.metadata?.name)
    || textValue(asArray(root.trk)[0]?.name)
    || "GPX 轨迹";

  return { name, points: validPoints };
}

module.exports = { parseGpx };
