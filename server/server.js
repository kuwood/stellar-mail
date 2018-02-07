require('dotenv').config();
const {promisify} = require('util');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const StellarSdk = require('stellar-sdk');
const rp = require('request-promise-native');
const mailgunDomain = 'mg.keithunderwood.com';
const mailgunDomainSandbox = 'sandbox1d7987a557874c438e988aa58937f34f.mailgun.org';
const testAccount = require('./testAccount');

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors());

app.use(require('morgan')('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

if(isProduction){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://localhost/stellar-mail');
  mongoose.set('xdebug', true);
}

// register models with app
require('./models/User');
const User = mongoose.model("User");
require('./models/EmailVerification');
require('./config/passport');

app.use(require('./routes'));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

const stellarUrl = isProduction ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
const horizon = new StellarSdk.Server(stellarUrl);

const sendMail = require("./services/sendMail");
const mailJob = horizon.payments()
  .cursor("now")
  .stream({
    onmessage: async message => {
      const {amount, to} = message;
      const asset = message.asset_type === "native" ? "XLM" : message.asset_type;
      try {
        const usersByPublicKey = await User.find()
          .elemMatch("accounts", {"public": to})

        if (usersByPublicKey.length > 0) {
          usersByPublicKey.forEach(user => {
            const accounts = user._doc.accounts.filter(account => account.public === to);
            if (accounts.length === 1 && accounts[0].active) {
              const email = {
                to: user.email,
                subject: 'New Stellar Payment!',
                text: `Hello ${user.username},\n\nThe account:\n${accounts[0].nickname}\n${to}\n\nrecieved ${amount} ${asset}!\n\nSincerely,\n\nStellar Mail`
              };
              sendMail(email);
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  })

app.listen(process.env.PORT || 8080, () => console.log(`server running on ${process.env.PORT || 8080}`));
