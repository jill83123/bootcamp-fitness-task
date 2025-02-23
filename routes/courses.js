const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CoursesController = require('../controllers/courses');

router.get('/', CoursesController.getCourseList);

router.post('/:courseId', auth, CoursesController.postCourseRegistration);

router.delete('/:courseId', auth, CoursesController.deleteCourseRegistration);

module.exports = router;
