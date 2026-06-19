const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'hiking-china-secret-change-in-production';

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
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
