const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('User');
const { isValidString } = require('../utils/valueChecks');

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const namePattern = /^[\p{Script=Han}a-zA-Z]{2,10}$/u;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;

    if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
      res.status(400).send({
        status: 'failed',
        message: '欄位未填寫正確',
      });
      return;
    }

    if (!namePattern.test(name)) {
      res.status(400).send({
        status: 'failed',
        message: '使用者名稱不符合規則，最少 2 個字，最多 10 個字，不可包含任何特殊符號與空白',
      });
      return;
    }

    if (!emailPattern.test(email)) {
      res.status(400).send({
        status: 'failed',
        message: 'Email 格式不正確',
      });
      return;
    }

    if (!passwordPattern.test(password)) {
      res.status(400).send({
        status: 'failed',
        message: '密碼不符合規則，需要包含英文數字大小寫，最短 8 個字，最長 16 個字',
      });
      return;
    }

    const userRepo = dataSource.getRepository('User');

    const existingEmail = await userRepo.findOne({ where: { email } });
    if (existingEmail) {
      res.status(409).send({
        status: 'failed',
        message: 'Email 已被使用',
      });
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
});

module.exports = router;
