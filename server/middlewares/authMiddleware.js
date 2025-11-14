// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Authorization header missing' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });

    const token = parts[1];

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token payload' });

    // optional: ensure user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.userId = payload.id;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
