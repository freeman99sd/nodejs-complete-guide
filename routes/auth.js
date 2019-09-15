const express = require('express');

const { check, body } = require('express-validator/check');

const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email'),
    body(
      'password',
      'Please enter a password with number and text and minimum of 5 characters'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
  ],
  authController.postLogin
);

router.post(
  '/signup',
  check('email')
    .isEmail()
    .withMessage('请输入有效邮箱！')
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (userDoc) {
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject('email already exists');
        }
      });
    }),
  body('password', '请输入字符和数字，至少5个字符')
    .isLength({ min: 5 })
    .isAlphanumeric(),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('输入密码不一致');
    }
    return true;
  }),
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
