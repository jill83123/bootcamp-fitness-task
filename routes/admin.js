const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isCoach = require('../middleware/isCoach');
const AdminController = require('../controllers/admin');

router.post('/coaches/courses', auth, isCoach, AdminController.postCoachCourse);

router.put('/coaches/courses/:courseId', auth, isCoach, AdminController.putCoachCourse);

router.post('/coaches/:userId', auth, AdminController.postCoach);

router.get('/coaches/courses', auth, isCoach, AdminController.getCoachCourseList);

router.get('/coaches/courses/:courseId', auth, isCoach, AdminController.getCoachCourseDetail);

router.get('/coaches', auth, isCoach, AdminController.getCoachProfile);

router.put('/coaches', auth, isCoach, AdminController.putCoachProfile);

module.exports = router;
