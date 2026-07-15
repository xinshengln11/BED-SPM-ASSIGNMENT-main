const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
const requireAuth = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} = require('../middlewares/authValidation');

const router = express.Router();

router.post('/register', validateRegister, asyncHandler(authController.register));
router.post('/login', validateLogin, asyncHandler(authController.login));
router.post('/logout', authController.logout);
router.get('/profile', requireAuth, asyncHandler(authController.getProfile));
router.put('/profile', requireAuth, validateUpdateProfile, asyncHandler(authController.updateProfile));
router.delete('/account', requireAuth, asyncHandler(authController.deleteAccount));
router.put('/change-password', requireAuth, validateChangePassword, asyncHandler(authController.changePassword));

module.exports = router;
