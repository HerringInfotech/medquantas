const nodemailer = require('nodemailer');
const _ = require("lodash")
const smtpTransport = require('nodemailer-smtp-transport');
const path = require('path');
const mailEmail = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;


exports.sendMail = async (req, res, next) => {
    try {
        var mail_content = "";
        mail_content += '<div style="width:100%;font-size:15px;font-family:Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background: #fff;border-radius: 5px;border: 1px solid #0c753c1f;"><div style="width: 100%;background: #0c763c;height: 5px;border-top-left-radius: 5px;border-top-right-radius: 5px;"></div><div style="text-align:center;width: 100%;"><img style="height:60px" src="cid:logo"  /></div><div style="padding:10px">';
        mail_content += req.data;
        mail_content += '</div><div style="width: 100%;background: #0c763c;height: 5px;border-bottom-left-radius: 5px;border-bottom-right-radius: 5px;"></div></div></div>';

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailEmail,
                pass: mailPass,
            }
        });

        // setup email data with unicode symbols
        const logoAttachment = {
            filename: 'medquantas.png',
            path: path.join(__dirname, '../../media/assets/logo/medquantas.png'),
            cid: 'logo'
        };

        let mailOptions = {
            from: mailEmail,
            to: req.to, // list of receivers
            subject: req.subject, // Subject line
            html: mail_content, // html body
            attachments: [...(req.attachments || []), logoAttachment] // attachments
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        // const transporter = nodemailer.createTransport(smtpTransport({
        //     host: 'smtp.office365.com',
        //     port: 587,
        //     secure: false, // Use TLS
        //     auth: {
        //         user: mailEmail,
        //         pass: mailPass
        //     },
        //     tls: {
        //         // do not fail on invalid certs
        //         rejectUnauthorized: false,
        //       },
        // }));

        // let mailOptions = {
        //     from: mailEmail,
        //     to: req.to,
        //     subject: req.subject,
        //     html: mail_content
        // };
        // console.log(mailOptions)

        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.error('Error sending email:', error);
        //     } else {
        //         console.log('Email sent:', info.response);
        //     }
        // });

    } catch (error) {
        console.log("exports.sendMail -> error", error);
        console.log("mailerro");
        return true;
    }
};

exports.sendRawMail = async ({ to, subject, html, attachments }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailEmail,
                pass: mailPass,
            }
        });
        const info = await transporter.sendMail({
            from: `"Medquantas Costing" <${mailEmail}>`,
            to,
            subject,
            html,
            attachments: attachments || []
        });
        console.log('Raw email sent:', info.response);
        return true;
    } catch (error) {
        console.error('sendRawMail error:', error);
        return false;
    }
};
