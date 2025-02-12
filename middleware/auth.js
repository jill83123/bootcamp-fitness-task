const jwt = require('jsonwebtoken');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Auth');
const generateError = require('../utils/generateError');

const UNAUTHORIZED_STATUS_CODE = 401;

/**
 * verify JSON Web Token
 * @param {String} token
 * @param {String} secret
 * @returns {Promise<Object>}
 */
const verifyJWT = (token, secret = process.env.JWT_SECRET) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, payload) => {
      if (err?.name === 'TokenExpiredError') {
        reject(generateError(UNAUTHORIZED_STATUS_CODE, 'token 已過期'));
        return;
      } else if (err) {
        reject(generateError(UNAUTHORIZED_STATUS_CODE, '無效的 token'));
        return;
      }
      resolve(payload);
    });
  });
};

const auth = async (req, res, next) => {
  try {
    if (!req.headers?.authorization?.startsWith('Bearer')) {
      next(generateError(UNAUTHORIZED_STATUS_CODE, '請先登入'));
      return;
    }

    const token = req.headers.authorization.split(' ')[1];
    const verifyResult = await verifyJWT(token);

    const userRepo = dataSource.getRepository('User');
    const existingUser = await userRepo.findOne({ where: { id: verifyResult.id } });
    if (!existingUser) {
      next(generateError(UNAUTHORIZED_STATUS_CODE, '無效的 token'));
      return;
    }

    req.user = existingUser;
    next();
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = auth;
