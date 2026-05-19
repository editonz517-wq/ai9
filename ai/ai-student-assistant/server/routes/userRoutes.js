const express = require('express');
const router  = express.Router();
const {
  avatarUpload, updateProfile, changePassword, getStats,
  adminGetUsers, adminDeleteUser, adminGetStats
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/profile',  avatarUpload.single('avatar'), updateProfile);
router.put('/password', changePassword);
router.get('/stats',    getStats);

// Admin
router.get('/admin/users',        adminOnly, adminGetUsers);
router.delete('/admin/users/:id', adminOnly, adminDeleteUser);
router.get('/admin/stats',        adminOnly, adminGetStats);

module.exports = router;
