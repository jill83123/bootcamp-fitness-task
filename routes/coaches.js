const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Skill');
const { isValidString, isNaturalNumber, isUUID } = require('../utils/valueChecks');
const generateError = require('../utils/generateError');

router.get('/', async (req, res, next) => {
  try {
    const { per, page } = req.query;

    if (
      !isValidString(per) ||
      !isValidString(page) ||
      !isNaturalNumber(+per) ||
      !isNaturalNumber(+page)
    ) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const coachRepo = dataSource.getRepository('Coach');
    const coaches = await coachRepo
      .createQueryBuilder('Coach') // 實體 (Coach) 的別名
      .innerJoin('Coach.User', 'User') // '實體別名.關聯實體', '關聯實體 (User) 的別名'
      .select(['Coach.id', 'User.name']) // 使用別名選取欄位
      .take(per)
      .skip((page - 1) * per)
      .getMany();

    const data = coaches.map((coach) => ({
      id: coach.id,
      name: coach.User.name,
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

router.get('/:coachId', async (req, res, next) => {
  try {
    const { coachId } = req.params;

    if (!isUUID(coachId)) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const coachRepo = dataSource.getRepository('Coach');
    const coach = await coachRepo.findOne({
      select: {
        id: true,
        user_id: true,
        experience_years: true,
        description: true,
        profile_image_url: true,
        created_at: true,
        updated_at: true,
        User: {
          name: true,
          role: true,
        },
      },
      where: { id: coachId },
      relations: ['User'],
    });

    if (!coach) {
      next(generateError(400, '找不到該教練'));
      return;
    }

    const data = {
      user: {
        name: coach.User.name,
        role: coach.User.role,
      },
      coach: {
        id: coach.id,
        user_id: coach.user_id,
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url,
        created_at: coach.created_at,
        updated_at: coach.updated_at,
      },
    };

    res.status(200).send({
      status: 'success',
      data,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
