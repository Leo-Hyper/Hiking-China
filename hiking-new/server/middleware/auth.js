const jwt = require('jsonwebtoken');

// 生产环境必须显式配置 JWT_SECRET，缺失即启动失败（fail-loud），避免使用硬编码默认值上线
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET must contain at least 32 characters in production');
  }
}
const SECRET = process.env.JWT_SECRET || 'hiking-china-secret-change-in-production';
const ISSUER = 'hiking-china-api';
const AUDIENCE = 'hiking-china-web';

function generateToken(user) {
  return jwt.sign(
    { sub: String(user.id), username: user.username },
    SECRET,
    {
      algorithm: 'HS256',
      audience: AUDIENCE,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: ISSUER,
    },
  );
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET, {
      algorithms: ['HS256'],
      audience: AUDIENCE,
      issuer: ISSUER,
    });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) return null;
    return { ...payload, id };
  } catch (e) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token 已过期，请重新登录' });
  }
  req.user = decoded;
  req.userId = decoded.id;
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware, SECRET };
