const nodemailer = require("nodemailer");
const path = require("path");

// Set mail password
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: `${process.env.GMAIL_ID}`,
    pass: `${process.env.GMAIL_PASS_CODE}`,
  },
});

let mail = {};

mail.sendMail = function (
  to,
  subject,
  body,
  isHTML = true,
  attachments = [],
  cc = "",
  bcc = ""
) {
  return new Promise(function (fulfill, reject) {
    const logoPath = path.join(__dirname, "../public/logo.png");
    const mailOptions = {
      from: `${process.env.GMAIL_ID}`,
      to: to,
      subject: subject,
      text: isHTML ? "" : body,
      html: isHTML ? body : "",
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "logo" // This must match the cid in the HTML body
        },
        ...attachments,
      ],
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        fulfill(0);
        return console.log(error);
      }
      fulfill(1);
    });
  });
};

module.exports = mail;
