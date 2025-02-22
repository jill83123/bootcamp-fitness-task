const jwt = require('jsonwebtoken');
const config = require('../config/index');

/**
 * create JSON Web Token
 * @param {Object} payload
 * @param {String} secret
 * @param {Object} option
 * @returns {Promise<String>}
 */

const generateJWT = (
  payload = {},
  secret = config.get('secret.jwt.secret'),
  option = { expiresIn: config.get('secret.jwt.expires') },
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
