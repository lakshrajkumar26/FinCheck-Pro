// controllers/categoriesController.js
const prisma = require('../prismaClient');

async function createCategory(req, res, next) {
  try {
    const { name, parentId, meta } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    // if parentId provided, ensure it exists
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: Number(parentId) }});
      if (!parent) return res.status(400).json({ error: 'parent category not found' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
        meta: meta || null
      }
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    // optional: support search or parent filter in future
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
}

module.exports = { createCategory, listCategories };
