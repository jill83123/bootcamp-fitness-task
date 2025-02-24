const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UploadController = require('../controllers/upload');

router.post('/', auth, UploadController.postImage);

module.exports = router;
