const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isCoach = require('../middleware/isCoach');
const AdminController = require('../controllers/admin');

router.post('/coaches/courses', auth, isCoach, AdminController.postCoachCourse);

router.put('/coaches/courses/:courseId', auth, isCoach, AdminController.putCoachCourse);

router.post('/coaches/:userId', auth, AdminController.postCoach);

module.exports = router;
