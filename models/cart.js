const fs = require('fs');
const path = require('path');

const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'cart.json'
);

module.exports = class Cart {
  static addProduct(id, price) {
    fs.readFile(p, (err, fileContent) => {
      let cart = { products: [], totalPrice: 0 };
      if (!err) {
        cart = JSON.parse(fileContent);
      }

      const existingProductIndex = cart.products.findIndex(product => {
        return product.id === id;
      });
      let existingProduct;
      if (existingProductIndex >= 0) {
        existingProduct = cart.products[existingProductIndex];
      }
      let updatedProduct;
      if (existingProduct) {
        updatedProduct = { ...existingProduct };
        updatedProduct.qty += 1;
        cart.products[existingProductIndex] = updatedProduct;
      } else {
        updatedProduct = { id, qty: 1 };
        cart.products = [...cart.products, updatedProduct];
      }
      cart.totalPrice += +price;
      fs.writeFile(p, JSON.stringify(cart), error => {
        console.log(error);
      });
    });
  }

  static deleteProduct(id, price) {
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        console.log(err);
      } else {
        const cart = JSON.parse(fileContent);
        const deletedProductIndex = cart.products.findIndex(
          prod => prod.id === id
        );
        if (deletedProductIndex < 0) {
          return;
        }
        const deletedProductQty = cart.products[deletedProductIndex].qty;
        cart.totalPrice -= price * deletedProductQty;
        const updatedProducts = cart.products.filter(prod => prod.id !== id);
        cart.products = updatedProducts;

        fs.writeFile(p, JSON.stringify(cart), error => {
          console.log(error);
        });
      }
    });
  }

  static getCart(cb) {
    fs.readFile(p, (err, fileContent) => {
      if (err) {
        cb(null);
      } else {
        const cart = JSON.parse(fileContent);
        cb(cart);
      }
    });
  }
};
