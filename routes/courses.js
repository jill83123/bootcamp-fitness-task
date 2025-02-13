const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { IsNull } = require('typeorm');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Courses');
const { isUUID } = require('../utils/valueChecks');
const generateError = require('../utils/generateError');

router.get('/', async (req, res, next) => {
  try {
    const courseRepo = dataSource.getRepository('Course');
    const courses = await courseRepo.find({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true,
        User: {
          name: true,
        },
        Skill: {
          name: true,
        },
      },
      relations: ['User', 'Skill'],
    });

    const data = courses.map((course) => ({
      id: course.id,
      coach_name: course.User.name,
      skill_name: course.Skill.name,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
    }));

    res.status(200).send({
      status: 'success',
      data,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post('/:courseId', auth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { id: userId } = req.user;

    if (!isUUID(courseId)) {
      next(generateError(400, 'id 錯誤'));
      return;
    }

    const courseRepo = dataSource.getRepository('Course');
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase');
    const courseBookingRepo = dataSource.getRepository('CourseBooking');

    const existingCourse = await courseRepo.findOne({ where: { id: courseId } });
    if (!existingCourse) {
      next(generateError(400, '課程不存在'));
      return;
    }

    const existingBooking = await courseBookingRepo.findOne({
      where: { user_id: userId, course_id: courseId, cancelled_at: IsNull() },
    });
    if (existingBooking) {
      next(generateError(400, '已經報名過此課程'));
      return;
    }

    const userCanUseCreditNum = await creditPurchaseRepo.sum('purchased_credits', {
      user_id: userId,
    });
    const userUsedCreditNum = await courseBookingRepo.count({
      where: { user_id: userId, cancelled_at: IsNull() },
    });
    if (userUsedCreditNum >= userCanUseCreditNum) {
      next(generateError(400, '已無可使用堂數'));
      return;
    }

    const courseCurrentPeopleNum = await courseBookingRepo.count({
      where: { course_id: courseId, cancelled_at: IsNull() },
    });
    if (courseCurrentPeopleNum >= existingCourse.max_participants) {
      next(generateError(400, '已達最大參加人數，無法參加'));
      return;
    }

    const newBooking = courseBookingRepo.create({
      user_id: userId,
      course_id: courseId,
      booking_at: new Date().toISOString(),
    });
    await courseBookingRepo.save(newBooking);

    res.status(201).send({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete('/:courseId', auth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { id: userId } = req.user;

    if (!isUUID(courseId)) {
      next(generateError(400, 'id 錯誤'));
      return;
    }

    const courseRepo = dataSource.getRepository('Course');
    const courseBookingRepo = dataSource.getRepository('CourseBooking');

    const existingCourse = await courseRepo.findOne({ where: { id: courseId } });
    if (!existingCourse) {
      next(generateError(400, '課程不存在'));
      return;
    }

    const existingBooking = await courseBookingRepo.findOne({
      where: { user_id: userId, course_id: courseId, cancelled_at: IsNull() },
    });
    if (!existingBooking) {
      next(generateError(400, '未報名或已取消此課程'));
      return;
    }

    const updateResult = await courseBookingRepo.update(
      { id: existingBooking.id },
      {
        cancelled_at: new Date().toISOString(),
      },
    );
    if (updateResult.affected === 0) {
      next(generateError(400, '課程取消失敗'));
      return;
    }

    res.status(200).send({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
