const nodemailer = require('nodemailer');

const sendEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Smart Clinic" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Login Code',
    html: `<h2>Your verification code is:</h2>
           <h1>${code}</h1>
           <p>This code expires in 5 minutes.</p>`
  });
};

module.exports = sendEmail;
