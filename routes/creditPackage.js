const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('CreditPackage');
const { isValidString, isNaturalNumber, isUUID } = require('../utils/valueChecks');
const generateError = require('../utils/generateError');

router.get('/', async (req, res, next) => {
  try {
    const creditPackageRepo = dataSource.getRepository('CreditPackage');
    const creditPackages = await creditPackageRepo.find({
      select: ['id', 'name', 'credit_amount', 'price'],
    });

    res.status(200).send({
      status: 'success',
      data: creditPackages,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, credit_amount, price } = req.body;

    if (!isValidString(name) || !isNaturalNumber(credit_amount) || !isNaturalNumber(price)) {
      next(generateError(400, '欄位未填寫正確'));
      return;
    }

    const creditPackageRepo = dataSource.getRepository('CreditPackage');

    const existingCreditPackage = await creditPackageRepo.findOne({ where: { name } });
    if (existingCreditPackage) {
      next(generateError(409, '資料重複'));
      return;
    }

    const newCreditPackage = { name, credit_amount, price };
    const savedCreditPackage = await creditPackageRepo.save(
      creditPackageRepo.create(newCreditPackage),
    );

    res.status(200).send({
      status: 'success',
      data: savedCreditPackage,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params;

    if (!isValidString(creditPackageId) || !isUUID(creditPackageId)) {
      next(generateError(400, 'id 錯誤'));
      return;
    }

    const creditPackageRepo = dataSource.getRepository('CreditPackage');
    const result = await creditPackageRepo.delete(creditPackageId);

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
});

router.post('/:creditPackageId', auth, async (req, res, next) => {
  try {
    const { creditPackageId } = req.params;
    const { id: userId } = req.user;

    if (!isUUID(creditPackageId)) {
      next(generateError(400, 'id 錯誤'));
      return;
    }

    const creditPackageRepo = dataSource.getRepository('CreditPackage');
    const existingCreditPackage = await creditPackageRepo.findOne({
      where: { id: creditPackageId },
    });
    if (!existingCreditPackage) {
      next(generateError(400, 'id 錯誤'));
      return;
    }

    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase');
    const newCreditPurchase = {
      user_id: userId,
      credit_package_id: creditPackageId,
      purchased_credits: existingCreditPackage.credit_amount,
      price_paid: existingCreditPackage.price,
      purchase_at: new Date().toISOString(),
    };
    await creditPurchaseRepo.save(creditPurchaseRepo.create(newCreditPurchase));

    res.status(200).send({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
