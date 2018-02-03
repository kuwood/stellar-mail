require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const StellarSdk = require('stellar-sdk');
const rp = require('request-promise-native');
const mailgunDomain = 'mg.keithunderwood.com'
const mailgunDomainSandbox = 'sandbox1d7987a557874c438e988aa58937f34f.mailgun.org';
const testAccount = require('./testAccount');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

const horizon = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const mailJob = horizon.payments()
  // get pub key from db
  .forAccount(testAccount.b.public)
  .cursor('now')
  .stream({
    onmessage: message => {
      const {amount, to} = message;
      const asset = message.asset_type === 'native' ? 'XLM' : message.asset_type;
      const data = {
        // get email from db
        email: testAccount.b.email,
        pubKey: to,
        amount,
        asset
      };

      sendMail(data);
    }
  })


function sendMail(data) {
  const mailgunBaseUri = `https://api:${process.env.MAILGUN_API_KEY}@api.mailgun.net/v3/${mailgunDomain}`;
  const email = {
    from: 'Stellar Mail <mg@keithunderwood.com>',
    to: data.email,
    subject: 'New Stellar Payment!',
    text: `The account ${data.pubKey} just recieved ${data.amount} ${data.asset}!`
  };

  const options = {
    method: 'POST',
    uri: `${mailgunBaseUri}/messages`,
    qs: email
  };
   
  rp(options)
  .then(body => console.log(body))
  .catch(err => console.log('err:',err))
};

app.listen(process.env.PORT || 8080, () => console.log(`server running on ${process.env.PORT || 8080}`));
