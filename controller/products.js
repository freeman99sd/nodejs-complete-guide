import Product, { fetchAll } from '../models/product';

export function getAddProduct(req, res, next) {
  res.render('admin/add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product'
  });
}

export function postAddProduct(req, res, next) {
  const product = new Product(req.body.title);
  product.save();
  res.redirect('/');
}

export function getProducts(req, res, next) {
  fetchAll(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  });
}
