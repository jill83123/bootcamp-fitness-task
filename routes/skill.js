const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Skill');
const { isValidString, isUUID } = require('../utils/valueChecks');

router.get('/', async (req, res, next) => {
  try {
    const skillRepo = dataSource.getRepository('Skill');
    const skills = await skillRepo.find({ select: ['id', 'name'] });

    res.status(200).send({
      status: 'success',
      data: skills,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!isValidString(name)) {
      res.status(400).send({
        status: 'failed',
        message: '欄位未填寫正確',
      });
      return;
    }

    const skillRepo = dataSource.getRepository('Skill');

    const existingSkill = await skillRepo.findOne({ where: { name } });
    if (existingSkill) {
      res.status(409).send({
        status: 'failed',
        message: '資料重複',
      });
      return;
    }

    const newSkill = { name };
    const savedSkill = await skillRepo.save(skillRepo.create(newSkill));

    res.status(200).send({
      status: 'success',
      data: savedSkill,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete('/:skillId', async (req, res, next) => {
  try {
    const { skillId } = req.params;

    if (!isValidString(skillId) || !isUUID(skillId)) {
      res.status(400).send({
        status: 'failed',
        message: 'id 錯誤',
      });
      return;
    }

    const skillRepo = dataSource.getRepository('Skill');
    const result = await skillRepo.delete(skillId);

    if (result.affected === 0) {
      res.status(400).send({
        status: 'failed',
        message: 'id 不存在',
      });
      return;
    }

    res.status(200).send({
      status: 'success',
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
