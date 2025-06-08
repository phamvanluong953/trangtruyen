var nodemailer = require('nodemailer');

var sendMail = async function(to, subject, html) {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'phamluonglx2024@gmail.com',
        pass: 'ondsucpctcynvlyb'
      }
    });

    await transporter.sendMail({
      from: '"KICKBACK" <your.email@gmail.com>',
      to: to,
      subject: subject,
      html: html
    });

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendMail;
