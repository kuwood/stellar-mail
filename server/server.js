require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const StellarSdk = require('stellar-sdk');
const mailgunDomain = 'sandbox1d7987a557874c438e988aa58937f34f.mailgun.org';
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, mailgunDomain});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const testAccount = {
  P: 'GCSUOI5UM66YUL4HBVP4GXS4TRREY7Z3DKMYPAOYIEI3XRTHIABB7B4F',
  S: 'SBTR7OUPLJ7YXMG4F6UEJAHHBGD7O7TJOXCO4WJ4TWNFHDEGRUEBVYQ6'
}

const testAccount2 = {
  p: 'GBIZUAYHION4PRYXDWOQFSAXJBJ5G5MUVBBYIQRBCA4V6B6EJ42LU3WN',
  s: 'SCHKHPDOPURDODUNWRGUUYYOQ7XI662LZPLJKH7PG4RXEC4LPJM2G5PE'
}

const mailJob = server.payments()
  .forAccount('GBIZUAYHION4PRYXDWOQFSAXJBJ5G5MUVBBYIQRBCA4V6B6EJ42LU3WN')
  // .call()
  // .then(res => console.log(res))

  // .forAccount('GDA2X4J7OW4SCXAXCVHM6W4XTPUO4SDFO4HY2EX6C5ZDJ4B5MQJQEWAS')
  .cursor('now')
  .stream({
    onmessage: message => {
      const {amount, to} = message;
      const asset = message.asset_type === 'native' ? 'XLM' : message.asset_type;
      const data = {
        email: 'kunderwood510@gmail.com',
        pubKey: to,
        amount,
        asset
      };

      sendMail(data);
    }
  })
  // .then(accResult => console.log(accResult))
  // .catch(err => console.log(err));


function sendMail(data) {
  const email = {
    from: 'Excieted User <me@samples.mailgun.org>',
    to: data.email,
    subject: 'New Stellar Payment!',
    text: `The account ${data.pubKey} just recieved ${data.amount} ${data.asset}!`
  };
   
  mailgun.messages().send(email, function (error, body) {
    if (error) console.log('error:', error);
    console.log(body);
  })
};


var data = {
  from: 'Excited User <me@samples.mailgun.org>',
  to: 'kunderwood510@gmail.com',
  subject: 'Hello2',
  text: 'Testing some Mailgun awesomeness!2'
};

mailgun.messages().send(data, function (error, body) {
  if (error) console.log('error:', error);
  console.log(body);
})

app.listen(process.env.PORT || 8080, () => console.log(`server running on ${process.env.PORT || 8080}`));
