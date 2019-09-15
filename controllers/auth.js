const crypto = require('crypto');

const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transport = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        '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'
    }
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg
    });
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password!');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password!');
          return res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const password = req.body.password;
  const email = req.body.email;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      console.log(hashedPassword);
      const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] }
      });
      console.log(user);
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      return transport.sendMail({
        to: email,
        from: 'freeman99sd@test.com',
        subject: 'Singup succeed!',
        html: '<h1>You successfully signed up!</h1>'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No user found!');
          res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        return transport.sendMail({
          to: req.body.email,
          from: 'freeman99sd@test.com',
          subject: 'Password Reset',
          html: `
            <p>You requested a password reset</p>
            <p>Please click this <a href="http://localhost:3000/reset/${token}">link</a> to reset a new password!</p>
          `
        });
      })
      .catch(error => {
        console.log(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'No user found!');
        return res.redirect('/login');
      }
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        resetToken: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const password = req.body.password;
  const resetToken = req.body.resetToken;

  let resetUser;
  User.findOne({
    _id: userId,
    resetToken,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'No user found');
        res.redirect('/singup');
      }
      resetUser = user;
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
};
