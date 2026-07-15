const express = require('express');
const orderController = require('../controllers/orderController');
const asyncHandler = require('../middlewares/asyncHandler');
const requireAuth = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/history', requireAuth, asyncHandler(orderController.getOrderHistory));

module.exports = router;
