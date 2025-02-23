const express = require('express');
const router = express.Router();
const CoachesController = require('../controllers/coaches');

router.get('/', CoachesController.getCoachList);

router.get('/:coachId', CoachesController.getCoachDetail);

module.exports = router;
