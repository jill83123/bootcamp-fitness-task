const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('isCoach');
const generateError = require('../utils/generateError');

const UNAUTHORIZED_STATUS_CODE = 401;
const FAILED_MESSAGE = '使用者尚未成為教練';

const isCoach = async (req, res, next) => {
  try {
    const { role: userRole, id: userId } = req.user;

    if (userRole !== 'COACH') {
      next(generateError(UNAUTHORIZED_STATUS_CODE, FAILED_MESSAGE));
      return;
    }

    const coachRepo = dataSource.getRepository('Coach');
    const existingCoach = await coachRepo.findOne({ where: { user_id: userId } });
    if (!existingCoach) {
      next(generateError(UNAUTHORIZED_STATUS_CODE, FAILED_MESSAGE));
      return;
    }

    next();
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = isCoach;
