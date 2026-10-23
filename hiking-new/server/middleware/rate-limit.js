const rateLimit = require("express-rate-limit");

function testBypassEnabled() {
  return process.env.NODE_ENV === "test" && process.env.RATE_LIMIT_DISABLED === "1";
}

function createLimiter(options) {
  if (testBypassEnabled()) {
    return (req, res, next) => next();
  }
  return rateLimit(options);
}

module.exports = { createLimiter };
