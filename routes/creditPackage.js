const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CreditPackageController = require('../controllers/creditPackage');

router.get('/', CreditPackageController.getPackageList);

router.post('/', CreditPackageController.postPackage);

router.delete('/:creditPackageId', CreditPackageController.deletePackage);

router.post('/:creditPackageId', auth, CreditPackageController.postUserPurchasePackage);

module.exports = router;
