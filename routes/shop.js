const express = require('express');

const router = express.Router();
const productsController = require('../controller/products');

router.get('/', productsController.getProducts);

module.exports = router;
