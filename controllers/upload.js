const multer = require('multer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const config = require('../config/index');
const generateError = require('../utils/generateError');
const logger = require('../utils/logger')('Upload');

initializeApp({
  credential: cert(config.get('secret.firebase.credential')),
  storageBucket: config.get('secret.firebase.storageBucket'),
});
const bucket = getStorage().bucket();

const UploadController = {
  postImage: async (req, res, next) => {
    try {
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
      const ALLOWED_FILE_TYPES = new Set(['image/jpg', 'image/jpeg', 'image/png']);

      const upload = multer({
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, callback) => {
          if (!ALLOWED_FILE_TYPES.has(file.mimetype)) {
            callback(generateError(400, '圖片格式錯誤，僅限 jpg、jpeg、png 格式'));
            return;
          }
          callback(null, true);
        },
      }).single('image');

      const checkFile = (req, res) => {
        return new Promise((resolve, reject) => {
          upload(req, res, (err) => {
            if (err) {
              switch (err.code) {
                case 'LIMIT_FILE_SIZE':
                  reject(generateError(400, '圖片不得大於 2mb'));
                  break;
                case 'LIMIT_UNEXPECTED_FILE':
                  reject(generateError(400, '一次只能上傳一張圖片'));
                  break;
                default:
                  logger.error(err);
                  reject(generateError(err.statusCode || 500, err.message || '上傳失敗'));
              }
            }
            resolve(true);
          });
        });
      };

      await checkFile(req, res);

      const ext = req.file.mimetype.split('/').pop();
      const filePath = `images/${Date.now()}-${Math.round(Math.random() * 1e13)}.${ext}`;

      const blob = bucket.file(filePath); // 建立一個 File 物件，代表 Storage 中的某個檔案
      const blobStream = blob.createWriteStream(); // 建立一個可寫入的串流，用來將檔案資料寫入指定的 blob

      blobStream.end(req.file.buffer); // 將檔案的 Buffer 寫入 blobStream，開始上傳檔案

      blobStream.on('finish', () => {
        const config = {
          action: 'read',
          expires: '12-31-2500',
        };

        blob.getSignedUrl(config, (err, imgUrl) => {
          if (err) {
            logger.error(err);
            next(generateError(500, '上傳失敗'));
            return;
          }

          res.status(200).send({
            status: 'success',
            data: { image_url: imgUrl },
          });
        });
      });

      blobStream.on('error', (err) => {
        logger.error(err);
        next(generateError(500, '上傳失敗'));
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  },
};

module.exports = UploadController;
