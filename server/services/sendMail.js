const rp = require("request-promise-native");

function sendMail(data) {
  const mailgunDomain = "mg.keithunderwood.com";
  const mailgunBaseUri = `https://api:${process.env.MAILGUN_API_KEY}@api.mailgun.net/v3/${mailgunDomain}`;
  const email = {
    from: "Stellar Mail <mg@keithunderwood.com>",
    to: data.to,
    subject: data.subject,
    text: data.text
  };

  const options = {
    method: "POST",
    uri: `${mailgunBaseUri}/messages`,
    qs: email
  };

  return rp(options)
    .then(body => console.log(body))
    .catch(err => console.log("err:", err));
}

module.exports = sendMail;
