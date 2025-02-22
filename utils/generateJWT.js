const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * create JSON Web Token
 * @param {Object} payload
 * @param {String} secret
 * @param {Object} option
 * @returns {Promise<String>}
 */

const generateJWT = (
  payload = {},
  secret = process.env.JWT_SECRET,
  option = { expiresIn: process.env.JWT_EXPIRES },
) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, option, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });
};

module.exports = generateJWT;
