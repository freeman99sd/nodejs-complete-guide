const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let db;

const mongoConnect = callback => {
  MongoClient.connect('mongodb://localhost/node-complete')
    .then(client => {
      console.log('connected');
      db = client.db();
      callback();
    })
    .catch(err => {
      console.log(err);
    });
};

const getDb = () => {
  if (db) {
    return db;
  }
  throw new Error('No database connection!');
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
