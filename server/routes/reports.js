const express = require('express');
const router = express.Router();
const { companyBalance, userExpenses } = require('../controllers/reportsController');

// router.get('/balance', companyBalance);
router.get('/user-expenses', userExpenses);

module.exports = router;
