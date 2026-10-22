const jwt = require('jsonwebtoken');
const { getUserAuthState } = require('../models/user');

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
    {
      sub: String(user.id),
      username: user.username,
      role: user.role || 'user',
      auth_version: Number(user.auth_version || 0),
    },
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

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token 已过期，请重新登录' });
  }

  try {
    const state = await getUserAuthState(decoded.id);
    if (!state || String(state.account_status || 'active') === 'deleted') {
      return res.status(401).json({ error: '账号不存在，请重新登录' });
    }
    if (String(state.account_status || 'active') !== 'active') {
      return res.status(403).json({ error: '账号已被暂停，请联系管理员' });
    }
    if (Number(decoded.auth_version || 0) !== Number(state.auth_version || 0)) {
      return res.status(401).json({ error: '登录状态已失效，请重新登录' });
    }

    req.user = {
      ...decoded,
      role: state.role || 'user',
      email_verified: Number(state.email_verified) === 1,
    };
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error('[AUTH] state check failed:', error);
    return res.status(500).json({ error: '登录状态校验失败' });
  }
}

function requireVerifiedEmail(req, res, next) {
  if (!req.user?.email_verified) {
    return res.status(403).json({
      error: '请先验证邮箱后再操作',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
}

function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      return res.status(403).json({ error: '无权执行此操作' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  requireVerifiedEmail,
  requireRole,
  SECRET,
};
