const _ = require('lodash');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  req.user
    .createProduct({
      title,
      price,
      imageUrl,
      description
    })
    .then(() => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    res.redirect('/');
  } else {
    const prodId = req.params.productId;
    req.user
      .getProducts({ where: { id: prodId } })
      .then(products => {
        if (products.length <= 0) {
          return;
        }
        const product = products[0];
        if (!product) {
          res.redirect('/');
        }
        res.render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: editMode,
          product
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  req.user
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length <= 0) {
        return Promise.resolve(null);
      }
      const product = products[0];
      const updatedProduct = _.clone(product);
      updatedProduct.title = title;
      updatedProduct.price = price;
      updatedProduct.imageUrl = imageUrl;
      updatedProduct.description = description;
      return updatedProduct.save();
    })
    .then(result => {
      // console.log(result);
      console.log('PRODUCT UPDATED!!');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length > 0) {
        return products[0].destroy();
      }
      return Promise.resolve(null);
    })
    .then(result => {
      console.log('PRODUCT DELETED!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};
