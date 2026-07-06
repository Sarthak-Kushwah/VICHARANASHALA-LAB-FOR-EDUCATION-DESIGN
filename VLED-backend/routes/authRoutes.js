const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Map endpoints to controller methods
router.post('/signup', faqController.signup);
router.post('/login', faqController.login);

module.exports = router;
