const Sequelize = require('sequelize').Sequelize;

const sequelize = new Sequelize('node-complete', 'root', 'Wzf@1130', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;
