const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('CreditPackage');
const { isValidString, isNaturalNumber, isUUID } = require('../utils/valueChecks');

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
      res.status(400).send({
        status: 'failed',
        message: '欄位未填寫正確',
      });
      return;
    }

    const creditPackageRepo = dataSource.getRepository('CreditPackage');

    const existingCreditPackage = await creditPackageRepo.findOne({ where: { name } });
    if (existingCreditPackage) {
      res.status(409).send({
        status: 'failed',
        message: '資料重複',
      });
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
      res.status(400).send({
        status: 'failed',
        message: 'id 錯誤',
      });
      return;
    }

    const creditPackageRepo = dataSource.getRepository('CreditPackage');
    const result = await creditPackageRepo.delete(creditPackageId);

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
