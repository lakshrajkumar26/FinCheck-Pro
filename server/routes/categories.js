const express = require('express');
const router = express.Router();
const { createCategory, listCategories } = require('../controllers/categoriesController');

router.post('/', createCategory);
router.get('/', listCategories);

module.exports = router;
