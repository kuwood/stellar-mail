const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const crypto = require("crypto");
const User = mongoose.model("User");
const auth = require("../auth");
const EmailVerification = mongoose.model("EmailVerification");
const sendMail = require("../../services/sendMail");

router.post("/users/login", (req, res, next) => {
  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: `can't be blank` } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: `can't be blank` } });
  }

  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.get("/users/confirmation/:token", (req, res, next) => {
  EmailVerification.findOne({ token: req.params.token })
    .then(token => {
      if (!token)
        return res.status(400).send({
          type: "not-verified",
          msg: "We were unable to find a valid token. Your token my have expired."
        });
      // If we found a token, find a matching user
      User.findOne({ _id: token._userId })
        .then(user => {
          if (!user)
            return res
              .status(400)
              .send({ msg: "We were unable to find a user for this token." });
          if (user.isVerified)
            return res.status(400).send({
              type: "already-verified",
              msg: "This user has already been verified."
            });
          // Verify and save the user
          user.isVerified = true;
          user
            .save()
            .then(user => {
              res
                .status(200)
                .send("The account has been verified. Please log in.");
            })
            .catch(err => res.status(500).send({ msg: err.message }));
        })
        .catch(err => res.status(500).send({ msg: err.message }));
    })
    .catch(next);
});

router.get("/users/resend/:email", (req, res, next) => {
  User.findOne({ email: req.params.email })
    .then(user => {
      if (!user)
        return res
          .status(400)
          .send({ msg: "We were unable to find a user with that email." });
      if (user.isVerified)
        return res.status(400).send({
          msg: "This account has already been verified. Please log in."
        });

      // Create a verification token, save it, and send email
      const emailVerification = new EmailVerification({
        _userId: user._id,
        token: crypto.randomBytes(16).toString("hex")
      });

      // Save the token
      EmailVerification.save()
        .then(savedEmailVerification => {
          // Send the email
          const email = {
            to: user.email,
            subject: "Stellar Mail Account Verification",
            text: `Hello, \n\n Please verify your Stellar Mail account by clicking the following link: \nhttp://${req.headers.host}/api/user/confirmation/${savedEmailVerification.token}.\n`
          };
          sendMail(email)
            .then(() => {
              res.json({
                message: `A verification email has been sent to ${email.to}.`
              });
            })
            .catch(error => res.status(500).send({ msg: error.message }));
        })
        .catch(err => res.status(500).send({ msg: err.message }));
    })
    .catch(next);
});

router.post("/users", (req, res, next) => {
  const user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user
    .save()
    .then(savedUser => {
      const emailVerification = new EmailVerification({
        _userId: savedUser._id,
        token: crypto.randomBytes(16).toString("hex")
      });

      emailVerification
        .save()
        .then(savedEmailVerification => {
          // Send the email
          const email = {
            to: user.email,
            subject: "Stellar Mail Account Verification",
            text: `Hello, \n\n Please verify your Stellar Mail account by clicking the following link: \nhttp://${req.headers.host}/api/user/confirmation/${savedEmailVerification.token}.\n`
          };
          sendMail(email)
            .then(() => {
              res.json({
                message: `A verification email has been sent to ${email.to}.`
              });
            })
            .catch(error => res.status(500).send({ msg: error.message }));
        })
        .catch(err => res.status(500).send({ msg: err.message }));
    })
    .catch(next);
});

module.exports = router;
