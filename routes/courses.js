const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CoursesController = require('../controllers/courses');

router.get('/', CoursesController.getCourseList);

router.post('/:courseId', auth, CoursesController.postCourseBooking);

router.delete('/:courseId', auth, CoursesController.deleteCourseBooking);

module.exports = router;
