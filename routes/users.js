const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UsersController = require('../controllers/users');

router.post('/signup', UsersController.postSignup);

router.post('/login', UsersController.postLogin);

router.put('/password', auth, UsersController.putPassword);

router.get('/profile', auth, UsersController.getProfile);

router.put('/profile', auth, UsersController.putProfile);

router.get('/credit-package', auth, UsersController.getPurchasedPackages);

router.get('/courses', auth, UsersController.getBookedCourses);

module.exports = router;
