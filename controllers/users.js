const bcrypt = require('bcrypt');
const { dataSource } = require('../db/data-source');
const { isValidString } = require('../utils/valueChecks');
const generateJWT = require('../utils/generateJWT');
const generateError = require('../utils/generateError');
const logger = require('../utils/logger')('Users');

const isValidUserName = (value) => {
  const namePattern = /^[\p{Script=Han}a-zA-Z]{2,10}$/u;
  return namePattern.test(value);
};

const isValidEmail = (value) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(value);
};

const isValidPassword = (value) => {
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
  return passwordPattern.test(value);
};

const failedMessageMap = {
  emailFormat: 'Email 格式不正確',
  passwordRules: '密碼不符合規則，需要包含英文數字大小寫，最短 8 個字，最長 16 個字',
  userNameRules: '使用者名稱不符合規則，最少 2 個字，最多 10 個字，不可包含任何特殊符號與空白',
};

const UsersController = {
  postSignup: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      if (!isValidUserName(name)) {
        next(generateError(400, failedMessageMap.userNameRules));
        return;
      }

      if (!isValidEmail(email)) {
        next(generateError(400, failedMessageMap.emailFormat));
        return;
      }

      if (!isValidPassword(password)) {
        next(generateError(400, failedMessageMap.passwordRules));
        return;
      }

      const userRepo = dataSource.getRepository('User');

      const existingEmail = await userRepo.findOne({ where: { email } });
      if (existingEmail) {
        next(generateError(409, 'Email 已被使用'));
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = { name, email, password: hashedPassword, role: 'USER' };
      const savedUser = await userRepo.save(userRepo.create(newUser));

      res.status(201).send({
        status: 'success',
        data: {
          user: {
            id: savedUser.id,
            name: savedUser.name,
          },
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  postLogin: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!isValidString(email) || !isValidString(password)) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      if (!isValidEmail(email)) {
        next(generateError(400, failedMessageMap.emailFormat));
        return;
      }

      if (!isValidPassword(password)) {
        next(generateError(400, failedMessageMap.passwordRules));
        return;
      }

      const userRepo = dataSource.getRepository('User');
      const existingUser = await userRepo.findOne({
        select: ['id', 'name', 'role', 'password'],
        where: { email },
      });
      if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
        next(generateError(400, '使用者不存在或密碼輸入錯誤'));
        return;
      }

      const token = await generateJWT({ id: existingUser.id, role: existingUser.role });

      res.status(200).send({
        status: 'success',
        data: {
          token,
          user: {
            name: existingUser.name,
          },
        },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  getProfile: async (req, res, next) => {
    try {
      const { id: userId } = req.user;

      const userRepo = dataSource.getRepository('User');
      const user = await userRepo.findOne({
        select: ['name', 'email'],
        where: { id: userId },
      });

      res.status(200).send({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },

  putProfile: async (req, res, next) => {
    try {
      const { name } = req.body;
      const { id: userId } = req.user;

      if (!isValidString(name)) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      if (!isValidUserName(name)) {
        next(generateError(400, failedMessageMap.userNameRules));
        return;
      }

      const userRepo = dataSource.getRepository('User');

      const user = await userRepo.findOne({ select: ['name'], where: { id: userId } });
      if (user.name === name) {
        next(generateError(400, '使用者名稱未變更'));
        return;
      }

      const updatedResult = await userRepo.update({ id: userId }, { name });
      if (updatedResult.affected === 0) {
        next(generateError(400, '使用者資料更新失敗'));
        return;
      }

      const finalResult = await userRepo.findOne({ select: ['name'], where: { id: userId } });

      res.status(200).send({
        status: 'success',
        data: { user: finalResult },
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },
};

module.exports = UsersController;
