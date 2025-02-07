const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')

router.get('/', async (req, res, next) => {

})

router.post('/', async (req, res, next) => {
})

router.delete('/:creditPackageId', async (req, res, next) => {
})

module.exports = router
