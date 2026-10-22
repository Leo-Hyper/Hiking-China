const crypto = require("crypto");

function requestContext(req, res, next) {
  const startedAt = Date.now();
  const requestId = String(req.get("x-request-id") || crypto.randomUUID());
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const payload = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      request_id: requestId,
      method: req.method,
      path: req.originalUrl?.split("?")[0] || req.path,
      status: res.statusCode,
      duration_ms: Date.now() - startedAt,
      user_id: req.userId || null,
      ip: req.ip || "",
    };
    console.log(JSON.stringify(payload));
  });

  next();
}

module.exports = { requestContext };
