const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isCoach = require('../middleware/isCoach');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Admin');
const {
  isValidString,
  isNaturalNumber,
  isValidUrl,
  isUUID,
  isValidDateString,
} = require('../utils/valueChecks');
const generateError = require('../utils/generateError');

const isNotValidCourseInput = (course) => {
  return (
    !isUUID(course.skill_id) ||
    !isValidString(course.name) ||
    !isValidString(course.description) ||
    !isValidDateString(course.start_at) ||
    !isValidDateString(course.end_at) ||
    !isNaturalNumber(course.max_participants) ||
    // eslint-disable-next-line camelcase
    (course.meeting_url && !isValidUrl(course.meeting_url))
  );
};

router.post('/coaches/courses', auth, isCoach, async (req, res, next) => {
  try {
    const {
      user_id,
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url = null,
    } = req.body;

    const newCourse = {
      user_id,
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url,
    };

    if (!isUUID(user_id) || isNotValidCourseInput(newCourse)) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const userRepo = dataSource.getRepository('User');
    const skillRepo = dataSource.getRepository('Skill');
    const courseRepo = dataSource.getRepository('Course');

    // eslint-disable-next-line camelcase
    const existingUser = await userRepo.findOne({ select: ['role'], where: { id: user_id } });
    if (!existingUser) {
      next(generateError(400, '使用者不存在'));
      return;
    }
    if (existingUser?.role !== 'COACH') {
      next(generateError(400, '使用者尚未成為教練'));
      return;
    }

    // eslint-disable-next-line camelcase
    const existingSkill = await skillRepo.findOne({ where: { id: skill_id } });
    if (!existingSkill) {
      next(generateError(400, '專長不存在'));
      return;
    }

    const savedCourse = await courseRepo.save(courseRepo.create(newCourse));

    res.status(201).send({
      status: 'success',
      data: { course: savedCourse },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.put('/coaches/courses/:courseId', auth, isCoach, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url = null,
    } = req.body;

    const editCourse = {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url,
    };

    if (!isUUID(courseId) || isNotValidCourseInput(editCourse)) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const courseRepo = dataSource.getRepository('Course');
    const skillRepo = dataSource.getRepository('Skill');

    const existingCourse = await courseRepo.findOne({ where: { id: courseId } });
    if (!existingCourse) {
      next(generateError(400, '課程不存在'));
      return;
    }

    // eslint-disable-next-line camelcase
    const existingSkill = await skillRepo.findOne({ where: { id: skill_id } });
    if (!existingSkill) {
      next(generateError(400, '專長不存在'));
      return;
    }

    const updatedCourse = await courseRepo.update({ id: courseId }, { ...editCourse });
    if (updatedCourse.affected === 0) {
      next(generateError(400, '更新課程失敗'));
      return;
    }

    const course = await courseRepo.findOne({ where: { id: updatedCourse.id } });

    res.status(200).send({
      status: 'success',
      data: { course },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post('/coaches/:userId', auth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { experience_years, description, profile_image_url = null } = req.body;

    if (
      !isUUID(userId) ||
      !isNaturalNumber(experience_years) ||
      !isValidString(description) ||
      // eslint-disable-next-line camelcase
      (profile_image_url && !isValidUrl(profile_image_url))
    ) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const userRepo = dataSource.getRepository('User');
    const coachRepo = dataSource.getRepository('Coach');

    const existingUser = await userRepo.findOne({ where: { id: userId } });
    if (!existingUser) {
      next(generateError(400, '使用者不存在'));
      return;
    }
    if (existingUser?.role === 'COACH') {
      next(generateError(409, '使用者已經是教練'));
      return;
    }

    const updatedUser = await userRepo.update({ id: userId }, { role: 'COACH' });
    if (updatedUser.affected === 0) {
      next(generateError(400, '更新使用者失敗'));
      return;
    }

    const newCoach = { user_id: userId, experience_years, description, profile_image_url };
    const savedCoach = await coachRepo.save(coachRepo.create(newCoach));

    res.status(201).send({
      status: 'success',
      data: {
        user: {
          name: existingUser.name,
          role: 'COACH',
        },
        coach: savedCoach,
      },
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
