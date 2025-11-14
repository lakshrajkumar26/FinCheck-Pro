// controllers/reportsController.js
const prisma = require('../prismaClient');

async function totalBalance(req, res, next) {
  try {
    // Compute total credits and debits across all transactions (optional date range)
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const credits = await prisma.transaction.aggregate({
      where: { type: 'credit', ...(from || to ? { date: dateFilter } : {}) },
      _sum: { amount: true }
    });
    const debits = await prisma.transaction.aggregate({
      where: { type: 'debit', ...(from || to ? { date: dateFilter } : {}) },
      _sum: { amount: true }
    });

    const totalCredits = Number(credits._sum.amount || 0);
    const totalDebits = Number(debits._sum.amount || 0);
    const balance = totalCredits - totalDebits; // no openingBalance in simplified schema

    res.json({ totalCredits, totalDebits, balance });
  } catch (err) {
    next(err);
  }
}

async function userExpenses(req, res, next) {
  try {
    const { userId, from, to } = req.query;

    const where = {};
    if (userId) where.createdById = Number(userId);
    if (from || to) where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);

    const result = await prisma.transaction.groupBy({
      by: ['createdById', 'type'],
      where,
      _sum: { amount: true }
    });

    const out = {};
    for (const r of result) {
      const uid = r.createdById;
      if (!out[uid]) out[uid] = { userId: uid, totalCredit: 0, totalDebit: 0 };
      if (r.type === 'credit') out[uid].totalCredit = Number(r._sum.amount || 0);
      if (r.type === 'debit') out[uid].totalDebit = Number(r._sum.amount || 0);
    }
    res.json(Object.values(out));
  } catch (err) {
    next(err);
  }
}

module.exports = { totalBalance, userExpenses };
