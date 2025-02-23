const express = require('express');
const router = express.Router();
const SkillController = require('../controllers/skill');

router.get('/', SkillController.getSkillList);

router.post('/', SkillController.postSkill);

router.delete('/:skillId', SkillController.deleteSkill);

module.exports = router;
