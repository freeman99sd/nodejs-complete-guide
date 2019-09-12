const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

// eslint-disable-next-line func-names
userSchema.methods.addToCart = function(product) {
  const updateProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });

  const updatedCartItems = [...this.cart.items];
  let newQuantity = 1;
  if (updateProductIndex >= 0) {
    newQuantity = updatedCartItems[updateProductIndex].quantity + 1;
    updatedCartItems[updateProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({ productId: product._id, quantity: 1 });
  }

  const updatedCart = {
    items: updatedCartItems
  };

  this.cart = updatedCart;

  return this.save();
};

// eslint-disable-next-line func-names
userSchema.methods.removeProductFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class User {
//   constructor(username, email, cart, userId) {
//     this.username = username;
//     this.email = email;
//     this.cart = cart;
//     this._id = userId;
//   }

//   save() {
//     const db = getDb();
//     return db.collection('users').insertOne(this);
//   }

//   addToCart(product) {
//     const db = getDb();
//     const updateProductIndex = this.cart.items.findIndex(cp => {
//       return cp.productId.toString() === product._id.toString();
//     });

//     const updatedCartItems = [...this.cart.items];
//     let newQuantity = 1;
//     if (updateProductIndex >= 0) {
//       newQuantity = updatedCartItems[updateProductIndex].quantity + 1;
//       updatedCartItems[updateProductIndex].quantity = newQuantity;
//     } else {
//       updatedCartItems.push({ productId: product._id, quantity: 1 });
//     }

//     const updatedCart = {
//       items: updatedCartItems
//     };
//     return db
//       .collection('users')
//       .updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
//   }

//   deleteProductFromCart(productId) {
//     const db = getDb();
//     const updatedCartItems = this.cart.items.filter(item => {
//       return item.productId.toString() !== productId.toString();
//     });

//     return db
//       .collection('users')
//       .updateOne(
//         { _id: this._id },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then(products => {
//         const order = {
//           items: products,
//           user: { username: this.username, _id: this._id }
//         };
//         return db.collection('orders').insertOne(order);
//       })
//       .then(result => {
//         this.cart = { items: [] };
//         return db
//           .collection('users')
//           .updateOne({ _id: this._id }, { $set: { cart: { items: [] } } });
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection('orders')
//       .find({ 'user._id': this._id })
//       .toArray();
//   }

//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(i => {
//       return i.productId;
//     });
//     return db
//       .collection('products')
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then(products => {
//         return products.map(p => {
//           return {
//             ...p,
//             quantity: this.cart.items.find(i => {
//               return i.productId.toString() === p._id.toString();
//             }).quantity
//           };
//         });
//       });
//   }

//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection('users')
//       .findOne({ _id: new mongodb.ObjectID(userId) });
//   }
// }

// module.exports = User;
