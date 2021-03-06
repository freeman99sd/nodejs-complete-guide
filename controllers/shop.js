/* eslint-disable prefer-template */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEM_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;

  let totalItems;
  Product.find()
    .countDocuments()
    .then(prodNums => {
      totalItems = prodNums;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Prodcts',
        path: '/products',
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPrePage: page > 1,
        nextPage: page + 1,
        prePage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;

  let totalItems;
  Product.find()
    .countDocuments()
    .then(prodNums => {
      totalItems = prodNums;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPrePage: page > 1,
        nextPage: page + 1,
        prePage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = 'invoice-' + orderId + '.pdf';
  const invoice = path.join('data', 'invoices', invoiceName);

  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found!'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      // fs.readFile(invoice, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Disposition',
      //     'attachment; filename="' + invoiceName + '"'
      //   );
      //   return res.send(data);
      // });
      // const file = fs.createReadStream(invoice);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader(
      //   'Content-Disposition',
      //   'attachment; filename="' + invoiceName + '"'
      // );
      // file.pipe(res);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoice));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Hello World!', {
        underline: true
      });
      pdfDoc.text('-----------------------------');
      let totalPrice = 0;
      // pdfDoc
      //   .font(path.join(__dirname, '..', 'fonts', 'Songti.ttc'))
      //   .fontSize(14)
      //   .text('测试');
      order.products.forEach(prod => {
        totalPrice += +prod.product.price * prod.quantity;
        pdfDoc
          .font(
            path.join(__dirname, '..', 'fonts', 'PingFang.ttc'),
            'PingFangSC-Regular'
          )
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x $' +
              prod.product.price
          );
      });
      pdfDoc.text('----');
      pdfDoc.fontSize(20).text('total price: $' + totalPrice);
      pdfDoc.end();
    })
    .catch(err => {
      next(err);
    });
};
