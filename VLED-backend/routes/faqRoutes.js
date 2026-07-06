const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Saare routes Controller se link ho gaye
router.get('/', faqController.getAllFaqs);
router.post('/add', faqController.addFaq);
router.get('/trending', faqController.getTrendingFaqs);
router.get('/recent', faqController.getRecentFaqs);
router.get('/category/:categoryName', faqController.getCategoryFaqs);
router.get('/:id', faqController.increaseViews);
router.post('/chat', faqController.chatDummy);

module.exports = router;
