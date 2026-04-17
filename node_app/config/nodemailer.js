const nodemailer = require('nodemailer');
const _ = require("lodash")
const path = require('path');
const mailEmail = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;


const getEmailSignature = () => `
<table border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <tr>
        <td style="padding-right: 20px; vertical-align: middle;">
            <img src="cid:logo" alt="Medopharm Logo" style="height: 80px; width: auto; display: block;">
        </td>
        <td style="border-left: 2px solid #0c763c; padding-left: 20px; vertical-align: middle;">
            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #1a2e4f;">Costing Department</p>
            <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 14px; color: #64748b;">Medopharm</p>
        </td>
    </tr>
</table>
`;

exports.sendMail = async (req, res, next) => {
    try {
        var mail_content = "";
        mail_content += '<div style="width:100%;font-size:15px;font-family:Google Sans,Roboto,RobotoDraft,Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;background: #fff;border-radius: 5px;border: 1px solid #0c753c1f;"><div style="width: 100%;background: #0c763c;height: 5px;border-top-left-radius: 5px;border-top-right-radius: 5px;"></div><div style="padding:20px">';
        mail_content += req.data;
        mail_content += getEmailSignature();
        mail_content += '</div><div style="width: 100%;background: #0c763c;height: 5px;border-bottom-left-radius: 5px;border-bottom-right-radius: 5px;"></div></div></div>';

        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: mailEmail,
                pass: mailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // setup email data with unicode symbols
        const logoAttachment = {
            filename: 'medopharm.png',
            path: path.join(__dirname, '../../media/assets/logo/medopharm.png'),
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

    } catch (error) {
        console.log("exports.sendMail -> error", error);
        console.log("mailerro");
        return true;
    }
};

exports.sendRawMail = async ({ to, subject, html, attachments }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: mailEmail,
                pass: mailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const logoAttachment = {
            filename: 'medopharm.png',
            path: path.join(__dirname, '../../media/assets/logo/medopharm.png'),
            cid: 'logo'
        };

        const info = await transporter.sendMail({
            from: `"Medopharm Costing" <${mailEmail}>`,
            to,
            subject,
            html,
            attachments: [...(attachments || []), logoAttachment]
        });
        console.log('Raw email sent:', info.response);
        return true;
    } catch (error) {
        console.error('sendRawMail error:', error);
        return false;
    }
};

exports.getEmailSignature = getEmailSignature;