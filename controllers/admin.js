const { In } = require('typeorm');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { dataSource } = require('../db/data-source');
const {
  isValidString,
  isNaturalNumber,
  isValidUrl,
  isUUID,
  isValidDateString,
} = require('../utils/valueChecks');
const generateError = require('../utils/generateError');
const logger = require('../utils/logger')('Admin');

dayjs.extend(utc);

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

const AdminController = {
  postCoachCourse: async (req, res, next) => {
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
  },

  putCoachCourse: async (req, res, next) => {
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
  },

  postCoach: async (req, res, next) => {
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
  },

  getCoachCourseList: async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const courseRepo = dataSource.getRepository('Course');
      const courseList = await courseRepo
        .createQueryBuilder('Course')
        .select(['id', 'name', 'start_at', 'end_at', 'max_participants'])
        .where('user_id = :userId', { userId })
        .addSelect((qb) => {
          return qb
            .select('COUNT(*) AS participants')
            .from('CourseBooking')
            .where('course_id = Course.id')
            .andWhere('cancelled_at IS NULL');
        })
        .getRawMany();

      const result = courseList.map((course) => {
        const currentTime = new Date();
        const startAt = course.start_at;
        const endAt = course.end_at;

        let status = '';
        if (currentTime < startAt) status = '尚未開始';
        else if (currentTime < endAt) status = '報名中';
        else status = '已結束';

        return {
          id: course.id,
          status,
          name: course.name,
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
          participants: Number(course.participants),
        };
      });

      res.status(200).send({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  getCoachCourseDetail: async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const { courseId } = req.params;

      if (!isUUID(courseId)) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      const courseRepo = dataSource.getRepository('Course');
      const course = await courseRepo.findOne({
        select: {
          id: true,
          name: true,
          description: true,
          start_at: true,
          end_at: true,
          max_participants: true,
          Skill: {
            name: true,
          },
        },
        where: { id: courseId, user_id: userId },
        relations: ['Skill'],
      });

      if (!course) {
        next(generateError(400, '課程不存在'));
        return;
      }

      res.status(200).send({
        status: 'success',
        data: {
          id: course.id,
          skill_name: course.Skill.name,
          name: course.name,
          description: course.description,
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  getCoachProfile: async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const coachRepo = dataSource.getRepository('Coach');
      const coach = await coachRepo.findOne({
        select: ['id', 'experience_years', 'description', 'profile_image_url'],
        where: { user_id: userId },
        relations: ['CoachLinkSkill'],
      });

      res.status(200).send({
        status: 'success',
        data: {
          id: coach.id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          skill_ids: coach.CoachLinkSkill.map((link) => link.skill_id),
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  putCoachProfile: async (req, res, next) => {
    try {
      const { id: userId } = req.user;
      const {
        experience_years: experienceYears,
        description,
        profile_image_url: profileImageUrl = null,
        skill_ids: skillIds,
      } = req.body;

      if (
        !isNaturalNumber(experienceYears) ||
        !isValidString(description) ||
        (profileImageUrl && !isValidUrl(profileImageUrl)) ||
        !skillIds.every((skillId) => isUUID(skillId))
      ) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      const coachRepo = dataSource.getRepository('Coach');
      const skillRepo = dataSource.getRepository('Skill');
      const coachLinkSkillRepo = dataSource.getRepository('CoachLinkSkill');

      const existingSkillNum = await skillRepo.count({ where: { id: In(skillIds) } });
      if (skillIds.length !== existingSkillNum) {
        next(generateError(400, '專長不存在'));
        return;
      }

      const coach = await coachRepo.findOne({
        select: ['id', 'experience_years', 'description', 'profile_image_url'],
        where: { user_id: userId },
      });

      if (
        coach.experience_years !== experienceYears ||
        coach.description !== description ||
        coach.profile_image_url !== profileImageUrl
      ) {
        await coachRepo.update(
          { user_id: userId },
          { experience_years: experienceYears, description, profile_image_url: profileImageUrl },
        );
      }

      await coachLinkSkillRepo.delete({ coach_id: coach.id });
      await coachLinkSkillRepo.insert(
        skillIds.map((skillId) => ({ skill_id: skillId, coach_id: coach.id })),
      );

      const newCoachData = await coachRepo.findOne({
        select: ['id', 'experience_years', 'description', 'profile_image_url'],
        where: { user_id: userId },
        relations: ['CoachLinkSkill'],
      });

      res.status(200).send({
        status: 'success',
        data: {
          id: newCoachData.id,
          experience_years: newCoachData.experience_years,
          description: newCoachData.description,
          profile_image_url: newCoachData.profile_image_url,
          skill_ids: newCoachData.CoachLinkSkill.map((link) => link.skill_id),
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  getCoachRevenue: async (req, res, next) => {
    try {
      const monthMap = {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12,
      };

      const { month: monthName } = req.query;
      const { id: userId } = req.user;

      if (!isValidString(monthName) || !monthMap[monthName]) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      const year = dayjs().year();
      const startDate = dayjs.utc(`${year}-${monthMap[monthName]}`).startOf('month').toISOString();
      const endDate = dayjs.utc(`${year}-${monthMap[monthName]}`).endOf('month').toISOString();

      const courseRepo = dataSource.getRepository('Course');
      const courseBookingRepo = dataSource.getRepository('CourseBooking');
      const creditPurchaseRepo = dataSource.getRepository('CreditPurchase');

      const courseList = await courseRepo
        .createQueryBuilder('courseRepo')
        .select(['id'])
        .where('user_id = :userId', { userId })
        .andWhere('end_at >= :startDate', { startDate })
        .andWhere('end_at <= :endDate', { endDate })
        .getRawMany();
      const courseIds = courseList.map((course) => course.id);

      const participants = await courseBookingRepo
        .createQueryBuilder('CourseBooking')
        .where('course_id IN (:...courseIds)', { courseIds })
        .andWhere('cancelled_at IS NULL')
        .select(['COUNT(DISTINCT(user_id)) AS count'])
        .getRawOne();

      const courseCount = await courseBookingRepo
        .createQueryBuilder('CourseBooking')
        .where('course_id IN (:...courseIds)', { courseIds })
        .andWhere('cancelled_at IS NULL')
        .select(['COUNT(*) AS count'])
        .getRawOne();

      const purchaseData = await creditPurchaseRepo
        .createQueryBuilder('CreditPurchase')
        .select(['SUM(price_paid) AS total_price', 'SUM(purchased_credits) AS total_credits'])
        .getRawOne();

      const perCreditPrice = Math.floor(purchaseData.total_price / purchaseData.total_credits);

      res.status(200).send({
        status: 'success',
        data: {
          total: {
            participants: parseInt(participants.count),
            revenue: perCreditPrice * courseCount.count,
            course_count: parseInt(courseCount.count),
          },
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },
};

module.exports = AdminController;
