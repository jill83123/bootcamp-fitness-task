const { dataSource } = require('../db/data-source');
const { isValidString, isUUID } = require('../utils/valueChecks');
const generateError = require('../utils/generateError');
const logger = require('../utils/logger')('Skill');

const SkillController = {
  getSkillList: async (req, res, next) => {
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
  },

  postSkill: async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!isValidString(name)) {
        next(generateError(400, '欄位未填寫正確'));
        return;
      }

      const skillRepo = dataSource.getRepository('Skill');

      const existingSkill = await skillRepo.findOne({ where: { name } });
      if (existingSkill) {
        next(generateError(409, '資料重複'));
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
  },

  deleteSkill: async (req, res, next) => {
    try {
      const { skillId } = req.params;

      if (!isValidString(skillId) || !isUUID(skillId)) {
        next(generateError(400, 'id 錯誤'));
        return;
      }

      const skillRepo = dataSource.getRepository('Skill');
      const result = await skillRepo.delete(skillId);

      if (result.affected === 0) {
        next(generateError(400, 'id 不存在'));
        return;
      }

      res.status(200).send({
        status: 'success',
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },
};

module.exports = SkillController;
