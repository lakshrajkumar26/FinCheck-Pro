// controllers/userController.js
const prisma = require('../prismaClient');

async function createUser(req, res, next) {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'name and role required' });

    const data = { name, role };
    if (email) data.email = email;
    if (password) data.password = password; // consider hashing if you allow creating with password

    // If you want to auto-hash password when created via admin, hash it here.
    // For now, we store as-is if provided. (Better: hash with bcrypt)
    const user = await prisma.user.create({ data });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, listUsers };
