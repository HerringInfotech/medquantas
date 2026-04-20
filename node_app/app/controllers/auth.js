const commonHelper = require('../helpers/commonHelper');
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const Role = require("../models/role");
const ActivityLog = require("../models/ActivityLog");
const env = process.env;
const jwtSecret = process.env.JWT_SECRET || '12345Medo@'
const expired = process.env.JWT_TOKEN_EXPIRATION || '10h'
const Rolemanage = require("../models/rolemanage");
const nodemailers = require('../../config/nodemailer');
const { exec } = require('child_process');
const cron = require('node-cron');
require("dotenv").config();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const moment = require("moment");
const mime = require('mime');
const { logAction } = require("../helpers/logModel.helper");
const Costsheet = require("../models/costsheet");
const Salesheet = require("../models/salesheet");
const Salehistory = require("../models/saleshistory");
const _ = require("lodash")
const mailEmail = process.env.MAIL_USER || 'kuddals07@gmail.com';
const mailPass = process.env.MAIL_PASS || 'nljlqdevktgdltxx';


exports.sign_in = async (req, res, next) => {
    try {
        var requests = req.bodyParams
        if (!requests.email || !requests.password) {
            return res.apiResponse(false, "Invalid Params")
        }
        if (requests.email.includes('@') || requests.email.includes('.')) {
            var user_detail = await User.findOne({ email: requests.email }).populate('role_pop');
        }
        else {
            var user_detail = await User.findOne({ phone: requests.email }).populate('role_pop');
        }

        if (!user_detail) {
            if (requests.email.includes('@') || requests.email.includes('.')) {
                return res.apiResponse(false, "Email does not exist")
            }
            else {
                return res.apiResponse(false, "Phone Number does not exists")
            }
        }
        else {
            if (user_detail.status === 'Inactive') {
                return res.apiResponse(false, "User is inactive");
            }

            if (user_detail.comparePassword(requests.password)) {
                // Password Expiry Policy (90 days)
                const passwordAgeDays = moment().diff(moment(user_detail.passwordChangedAt || user_detail.createdAt), 'days');
                const isPasswordExpired = passwordAgeDays >= 90;

                if (isPasswordExpired) {
                    return res.apiResponse(true, "Your password has expired. Please change it to continue.", {
                        expired: true,
                        userId: user_detail._id
                    });
                }

                const firstLogin = !user_detail.lastLogin;
                var lastLogin = new Date();
                const updatedUser = await User.findOneAndUpdate({ "_id": user_detail.id }, { "$set": { lastLogin: lastLogin } }, { new: true }).populate('role_pop').exec();
                const token = jwt.sign({ userId: user_detail.role }, jwtSecret, {
                    algorithm: 'HS256',
                    expiresIn: expired,
                });

                // Log Login Activity
                await ActivityLog.create({
                    userId: user_detail._id,
                    userName: user_detail.name,
                    userEmail: user_detail.email,
                    module: 'Authentication',
                    action: 'Login',
                    description: `${user_detail.name} logged in successfully.`,
                    ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
                    status: 'Success'
                });

                return res.apiResponse(true, "Logged In Successfully", {
                    user_detail: updatedUser,
                    token,
                    firstLogin,
                });
            }
            else {
                return res.apiResponse(false, "Invalid Password")
            }
        }
    } catch (error) {
        console.log(error);
        return res.apiResponse(false, "Login function failed")
    }
}

exports.forgotpassword = async (req, res, next) => {
    var requests = req.bodyParams
    var user = await User.findOne({ email: requests.email });

    if (!user) {
        return res.apiResponse(false, "Email does not exist")
    }
    else {
        // var token = crypto.randomBytes(3).toString('hex');
        var token = "123456";
        var mail_data = {}
        mail_data.user_name = user.name;
        mail_data.site_name = commonHelper.siteName();
        mail_data.site_url = commonHelper.getBaseurl();
        mail_data.new_password = token;
        var content = `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <p>Hello ${user.name},</p>
            <p>Your password has been reset. Please use the password mentioned below to log in to your Costing App Account.</p>
            <p style="font-size: 16px;">New Password: <strong>${mail_data.new_password}</strong></p>
          </div>
        `;
        nodemailers.sendMail({
            'to': requests.email,
            'slug': 'forgot_password',
            'subject': 'Forgot Password',
            'data': content,
        });
        user.password = token;
        await user.save();
        return res.apiResponse(true, "Reset password link sent to your email", { token })
    }
}



exports.change_password = async (req, res, next) => {
    const requests = req.bodyParams;
    const isAdmin = requests.admin || 2;

    // Password Strength Policy: Upper, Lower, Numeric, Special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const newPassword = requests.newPassword || requests.password;

    if (isAdmin != 1) { // Strength check for regular users
        if (!passwordRegex.test(newPassword)) {
            return res.apiResponse(false, "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
        }
    }

    if (isAdmin == 1) {
        var user = await User.findOne({ _id: requests.userid });
        if (user) {
            user.password = requests.password
            await user.save()
            await ActivityLog.create({ userId: user._id, userName: user.name, userEmail: user.email, module: 'Authentication', action: 'Password Change', description: `Password reset by admin for ${user.name}.`, status: 'Success' });
            return res.apiResponse(true, "Password changed successfully.")
        }
    }
    else {
        var user = await User.findOne({ _id: requests.userid });
        if (requests.currentPassword != "" && requests.currentPassword) {
            if (user.comparePassword(requests.currentPassword)) {
                user.password = requests.newPassword
                await user.save()
                await ActivityLog.create({ userId: user._id, userName: user.name, userEmail: user.email, module: 'Authentication', action: 'Password Change', description: `${user.name} changed their password.`, status: 'Success' });
                return res.apiResponse(true, "Password changed successfully.")
            }
            else {
                return res.apiResponse(false, "Old Password is Invalid Password")
            }
        } else if (requests.isExpiredChange) {
            user.password = requests.newPassword;
            await user.save();
            await ActivityLog.create({ userId: user._id, userName: user.name, userEmail: user.email, module: 'Authentication', action: 'Password Change', description: `${user.name} updated expired password.`, status: 'Success' });
            return res.apiResponse(true, "Password updated successfully.");
        }
    }
}

exports.sign_up = async (req, res, next) => {
    var requests = req.bodyParams
    requests = await commonHelper.trimLogi(requests);
    if (!requests.name || !requests.role || !requests.email || !requests.password || !requests.mobile) {
        return res.apiResponse(false, "Invalid Params !")
    }
    const checkUser = await User.findOne({ $or: [{ email: requests.email }, { mobile: requests.mobile }] });
    if (checkUser) {
        if (checkUser.email == requests.email) {
            return res.apiResponse(false, "Email already exists.");
        } else if (checkUser.mobile === requests.mobile) {
            return res.apiResponse(false, "Phone Number is already exists.");
        }
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(requests.password)) {
        return res.apiResponse(false, "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
    }

    requests.lastLogin = null;
    var user = new User(requests);
    await user.save();

    // Send Welcome Email
    try {
        const site_url = commonHelper.getBaseurl();
        const welcomeEmailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1a2e4f; padding: 25px; text-align: center;">
                <img src="cid:logo" alt="Medquantas Logo" style="height: 80px; width: auto;">
            </div>
            <div style="padding: 40px; background-color: #ffffff;">
                <p style="margin-top: 0; font-size: 17px;">Dear <strong>${user.name}</strong>,</p>
                
                <p style="font-size: 20px; color: #1a2e4f; font-weight: 600; margin-bottom: 20px;">Welcome!</p>
                
                <p>Your user account has been successfully created in the <strong>Costing Application</strong>.</p>
                <p>You may now log in to the system using your assigned credentials and start accessing the required modules for your role.</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #edf2f7;">
                    <h3 style="margin-top: 0; font-size: 16px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Application Details</h3>
                    <div style="margin-top: 15px;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="color: #64748b; width: 120px; padding: 5px 0;">Application:</td>
                                <td style="font-weight: bold; padding: 5px 0;">Costing Application</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; width: 120px; padding: 5px 0;">User ID:</td>
                                <td style="font-weight: bold; padding: 5px 0;">${user.email}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; width: 120px; padding: 5px 0;">Password:</td>
                                <td style="font-weight: bold; padding: 5px 0;">${requests.password}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; width: 120px; padding: 5px 0;">Login URL:</td>
                                <td style="padding: 5px 0;"><a href="${site_url}/auth/login" style="color: #2563eb; text-decoration: none; font-weight: 500;">${site_url}/auth/login</a></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; color: #991b1b; font-size: 14px; border-radius: 4px;">
                    <strong>Note:</strong> Kindly change your password upon first login and ensure that your credentials are kept confidential.
                </p>
                
                <p style="margin-top: 25px;">If you face any issues while accessing the application, please feel free to contact the <strong>IT Team</strong> for assistance.</p>
                <p>Wishing you a smooth experience with the application.</p>
                
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                    ${nodemailers.getEmailSignature()}
                </div>
            </div>
        </div>
        `;

        await nodemailers.sendRawMail({
            to: user.email,
            subject: 'Welcome to Costing Application – Your Account Credentials',
            html: welcomeEmailHtml,
        });
    } catch (mailError) {
        console.error("Welcome email failed to send (sign_up):", mailError);
    }

    const token = jwt.sign({ userId: requests.role }, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: expired,
    });
    return res.apiResponse(true, "User registered successfully.", { user, token });

}

exports.speed = async (req, res, next) => {
    try {
        var requests = req.bodyParams;
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            const token = authorizationHeader.slice(7);
            try {
                const user = jwt.verify(token, jwtSecret);
                var access = await Rolemanage.findOne({ role_id: user.userId });
                if (access) {
                    const user_access = [];
                    for (const permission of access.permission) {
                        for (const action of permission.actions) {
                            if (action.isSelected) {
                                user_access.push({
                                    name: permission.name + "." + action.name,
                                    isSelected: action.isSelected,
                                });
                            }
                            else {
                                // "tesr"
                            }
                        }
                    }
                    return res.apiResponse(true, "speed received", { user_access });
                } else {
                    return res.apiResponse(false, "speed failed.");
                }
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired' });
                }
                throw error;
            }
        } else {
            return res.apiResponse(false, "Authentication required for speed.");
        }
    } catch (error) {
        console.log(error);
        return res.apiResponse(false, "Speed function failed");
    }
};

exports.get_user = async (req, res, next) => {
    var requests = req.bodyParams;
    var page = requests.page || 1
    var per_page = requests.per_page || 10
    var pagination = requests.pagination || "false"
    const match = {}
    var sort = { createdAt: -1 }

    const options = {
        page: page,
        limit: per_page,
        sort: sort,
        populate: ['role_pop']
    };

    if (typeof requests.id != "undefined" && requests.id != "") {
        match['_id'] = requests.id
    }
    if (pagination == "true") {
        User.paginate(match, options, function (err, users) {
            return res.apiResponse(true, "Success", { users })
        });
    }
    else {
        var users = await User.find(match).sort(sort).populate(options.populate);
        return res.apiResponse(true, "Success", { users })
    }

}


exports.change_status = async (req, res, next) => {
    try {
        var requests = req.bodyParams;
        if (requests.newStatus && requests.newStatus !== '') {
            const user = await User.findById(requests.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            user.status = requests.newStatus;
            await user.save();
            res.json({ message: 'Status changed successfully', user });
        }
    }
    catch (error) {
        console.log(error);
        return res.apiResponse(false, "change status function failed")
    }
}


exports.update_user = async (req, res, next) => {
    try {
        let requests = req.bodyParams;
        const user = requests.user;

        requests = await commonHelper.trimObjc(requests);
        requests.email = requests.email.toLowerCase();

        function capitalizeFirstLetter(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        const excludeFields = ["_id", "id", "__v", "createdAt", "updatedAt", "user"];
        let actionType;
        let logDescription = "";
        let logData = {};

        if (requests.id) {
            let update = {};
            if (requests.role && requests.role !== "") {
                update.name = requests.name;
                update.role = requests.role;
                update.email = requests.email;
                update.mobile = requests.mobile;
            }

            await upload_profile(req, requests.id);

            const existingUser = await User.findById(requests.id).lean();
            const updatedUser = await User.findOneAndUpdate(
                { _id: requests.id },
                { $set: update },
                { new: true }
            ).exec();

            const updatedFields = [];

            for (const key in update) {
                if (
                    excludeFields.includes(key) ||
                    typeof update[key] === "object" ||
                    existingUser[key] === update[key]
                ) {
                    continue;
                }

                let oldValue = existingUser[key];
                let newValue = update[key];

                if (key === "role") {
                    const [oldRoleDoc, newRoleDoc] = await Promise.all([
                        Role.findById(existingUser.role).lean(),
                        Role.findById(update[key]).lean()
                    ]);
                    oldValue = oldRoleDoc?.name || existingUser.role;
                    newValue = newRoleDoc?.name || update[key];
                }

                updatedFields.push(
                    `<b>${capitalizeFirstLetter(key)}</b>: changed from <b>"${oldValue ?? ""}"</b> to <b>"${newValue}"</b>`
                );

                logData[key] = {
                    from: oldValue ?? "",
                    to: newValue,
                };
            }

            if (updatedFields.length === 0) {
                logDescription = `Updated user "<b>${update.name}</b>", but no fields changed.`;
            } else {
                logDescription = `Updated user "<b>${update.name}</b>": ` + updatedFields.join(", ");
            }

            actionType = "update";

            await logAction({
                section: "user",
                user: user?._id,
                action: actionType,
                description: logDescription,
                data: logData,
            });

            return res.apiResponse(true, "User Updated Successfully", { user: updatedUser });
        } else {
            const checkUser = await User.findOne({
                $or: [{ email: requests.email }, { mobile: requests.mobile }]
            });

            if (checkUser) {
                if (checkUser.email === requests.email) {
                    return res.apiResponse(false, "Email already exists.");
                } else if (checkUser.mobile === requests.mobile) {
                    return res.apiResponse(false, "Phone Number already exists.");
                }
            }

            const newUser = new User(requests);
            await newUser.save();
            await upload_profile(req, newUser.id);

            // Send Welcome Email
            try {
                const site_url = commonHelper.getBaseurl();
                const welcomeEmailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 15px; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #1a2e4f; padding: 25px; text-align: center;">
                        <img src="cid:logo" alt="Medquantas Logo" style="height: 80px; width: auto;">
                    </div>
                    <div style="padding: 40px; background-color: #ffffff;">
                        <p style="margin-top: 0; font-size: 17px;">Dear <strong>${newUser.name}</strong>,</p>
                        
                        <p style="font-size: 20px; color: #1a2e4f; font-weight: 600; margin-bottom: 20px;">Welcome!</p>
                        
                        <p>Your user account has been successfully created in the <strong>Costing Application</strong>.</p>
                        <p>You may now log in to the system using your assigned credentials and start accessing the required modules for your role.</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #edf2f7;">
                            <h3 style="margin-top: 0; font-size: 16px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Application Details</h3>
                            <div style="margin-top: 15px;">
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="color: #64748b; width: 120px; padding: 5px 0;">Application:</td>
                                        <td style="font-weight: bold; padding: 5px 0;">Costing Application</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; width: 120px; padding: 5px 0;">User ID:</td>
                                        <td style="font-weight: bold; padding: 5px 0;">${newUser.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; width: 120px; padding: 5px 0;">Password:</td>
                                        <td style="font-weight: bold; padding: 5px 0;">${requests.password}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748b; width: 120px; padding: 5px 0;">Login URL:</td>
                                        <td style="padding: 5px 0;"><a href="${site_url}/auth/login" style="color: #2563eb; text-decoration: none; font-weight: 500;">${site_url}/auth/login</a></td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; color: #991b1b; font-size: 14px; border-radius: 4px;">
                            <strong>Note:</strong> Kindly change your password upon first login and ensure that your credentials are kept confidential.
                        </p>
                        
                        <p style="margin-top: 25px;">If you face any issues while accessing the application, please feel free to contact the <strong>IT Team</strong> for assistance.</p>
                        <p>Wishing you a smooth experience with the application.</p>
                        
                        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                            ${nodemailers.getEmailSignature()}
                        </div>
                    </div>
                </div>
                `;

                await nodemailers.sendRawMail({
                    to: newUser.email,
                    subject: 'Welcome to Costing Application – Your Account Credentials',
                    html: welcomeEmailHtml,
                });
            } catch (mailError) {
                console.error("Welcome email failed to send:", mailError);
            }

            logDescription = `Created user "<b>${newUser.name}</b>"`;
            logData = requests;
            actionType = "create";


            await logAction({
                section: "user",
                user: user?._id,
                action: actionType,
                description: logDescription,
                data: logData,
            });

            return res.apiResponse(true, "User created successfully", { user: newUser });
        }
    } catch (error) {
        console.log(error);
        return res.apiResponse(false, "update_user function failed");
    }
};

const upload_profile = async (req, id) => {
    let image_data = req.body.image;

    if (!image_data && req.files && req.files.image) {
        // Handle if sent as a file instead of base64 string
        image_data = req.files.image.data.toString('base64');
        if (!image_data.startsWith('data:')) {
            image_data = `data:${req.files.image.mimetype};base64,${image_data}`;
        }
    }

    if (image_data && typeof image_data != "undefined" && image_data != null) {
        var matches = image_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
        if (matches == null) {
            return false;
        }
        if (matches.length !== 3) {
            return false;
        }
        response.type = matches[1];
        response.data = Buffer.from(matches[2], 'base64');
        let decodedImg = response;
        let imageBuffer = decodedImg.data;
        let type = decodedImg.type;
        let extension = mime.getExtension(type);
        if (extension == "jpg" || extension == "png" || extension == "jpeg") {
            var d = new Date();
            let imageName = 'profile' + d.getTime() + id + '.' + extension;
            const path = 'media/assets/profile/';
            commonHelper.prepareUploadFolder(path)
            try {
                fs.writeFileSync(path + imageName, imageBuffer);
                var update_data = {};
                update_data.image = imageName;
                await User.findOneAndUpdate({ "_id": id }, { "$set": update_data }, { new: true }).exec();
            } catch (e) {
                console.log("Error saving profile image:", e);
                return false;
            }
        }
    }
    return true;
}

exports.send_mail = async (req, res, next) => {
    try {
        const requests = req.bodyParams;
        if (!requests.sheetID) {
            return res.apiResponse(false, 'Sheet ID is required');
        }
        if (!requests.email) {
            return res.apiResponse(false, 'Email does not exist');
        }

        const sheet = await Costsheet.findOne({ _id: requests.sheetID });
        if (!sheet) {
            return res.apiResponse(false, 'Cost sheet not found');
        }

        await Costsheet.updateOne(
            { _id: requests.sheetID },
            { $set: { status: 'Approved' } }
        );

        const mailData = {
            site_name: commonHelper.siteName(),
            site_url: commonHelper.getBaseurl(),
            costingID: sheet.productcode || sheet.code,
            requestorName: requests.user || 'Requestor',
        };

        const item = sheet.Medquantas;
        const rowsHtml = `
      <tr>
        <td style="text-align:center;">${item?.name || '-'}</td>
        <td style="text-align:center;">${item?.packtype || '-'}</td>
        <td style="text-align:center; white-space: nowrap;">₹ ${item?.api != null ? item.api : '0.00'}</td>
        <td style="text-align:center; white-space: nowrap;">₹ ${item?.rupee != null ? (+item.rupee).toFixed(2) : '-'}</td>
        <td style="text-align:center; white-space: nowrap;">$ ${item?.doller != null ? (+item.doller).toFixed(2) : '-'}</td>
        <td style="text-align:center;">${item?.convertrate || '-'}</td>
        <td style="text-align:center;">${item?.batchsize || '-'}</td>
        <td style="text-align:center;">-</td>
      </tr>
    `;

        const emailHtml = `
      <p><strong>Subject:</strong> Approved Cost Sheet Details – [${mailData.costingID}]</p>
      <p>Dear <strong>${mailData.requestorName}</strong>,</p>
      <p>The Cost Sheet for your request has been <strong>approved</strong>. Please find the details below for your reference:</p>

      <table border="1" cellpadding="5" cellspacing="0" 
             style="border-collapse: collapse; width: 100%; text-align: center;">
        <thead>
          <tr>
            <th style="background-color: #a9d08e;">Product</th>
            <th style="background-color: #a9d08e;">Packing Unit</th>
            <th style="background-color: #8ea9db;">API</th>
            <th style="background-color: #c9c9c9;">Rate INR</th>
            <th style="background-color: #c9c9c9;">Rate in USD</th>
            <th style="background-color: #d9d9d9;">Conversion Rate</th>
            <th style="background-color: #d9d9d9;">Minimum Batch size (In Lakh)</th>
            <th style="background-color: #d9d9d9;">Maximum Batch size (In Lakh)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="8">No items found.</td></tr>`}
        </tbody>
      </table>

      <p style="font-size: 0.8rem; margin-top: 5px;">
        THE ABOVE RATE IS FOR MIN B.SIZE, IF LESS THAN MIN.B.SIZE RATE TO BE REVISED
      </p>

      <p>Kindly review the details and acknowledge receipt.</p>
      
      <p style="margin-top: 10px;"><strong>Regards,</strong></p>
      
      ${nodemailers.getEmailSignature()}
    `;

        await nodemailers.sendRawMail({
            to: requests.email,
            subject: `Approved Cost Sheet Details – [${mailData.costingID}]`,
            html: emailHtml,
        });
        await Costsheet.updateOne(
            { _id: requests.sheetID },
            { $set: { mailStatus: 'Sent', mailSentAt: new Date() } }
        );
        return res.apiResponse(true, 'Approved and Email sent successfully', {});
    } catch (error) {
        console.error('Error sending mail:', error);
        if (req.bodyParams?.sheetID) {
            await Costsheet.updateOne(
                { _id: req.bodyParams.sheetID },
                { $set: { mailStatus: 'Failed' } }
            );
        }
        return res.apiResponse(false, 'Approved and Failed to send email', {});
    }
};

exports.send_costsheet = async (req, res, next) => {
    try {
        const requests = req.bodyParams;
        console.log(requests)
        if (!requests.sheetID) {
            return res.apiResponse(false, 'Sheet ID is required');
        }
        if (!requests.email) {
            return res.apiResponse(false, 'Email does not exist');
        }

        const sheet = await Salesheet.findOne({ _id: requests.sheetID });
        if (!sheet) {
            return res.apiResponse(false, 'Cost sheet not found');
        }

        const user = await User.findOne({ _id: requests.userID });
        if (!user) {
            return res.apiResponse(false, 'User not found');
        }
        const mailLogs = {
            productcode: sheet.productcode,
            productname: sheet.productname,
            user: user.name,
            type: 'mail',
            email: requests.email
        }

        const mailData = {
            site_name: commonHelper.siteName(),
            site_url: commonHelper.getBaseurl(),
            costingID: sheet.code,
            name: sheet.productname,
            requestorName: user.name || 'Requestor',
        };

        const item = sheet.Medquantas;
        const dateStr = sheet.createdAt ? moment(sheet.createdAt).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY');
        const costSheetStr = `${sheet.code} & ${dateStr}`;

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6;">
        <p>Dear Team,</p>
        
        <p>This is to formally notify that Cost Sheet [<strong>${costSheetStr}</strong>] has been generated in the Costing Application with the following details.</p>
        
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; text-align: center; border-color: #000; margin-bottom: 20px;">
            <thead>
                <tr style="font-weight: bold;">
                    <th style="padding: 10px;">Product<br/>Name</th>
                    <th style="padding: 10px;">FG<br/>Code</th>
                    <th style="padding: 10px;">Packing Unit</th>
                    <th style="padding: 10px;">API</th>
                    <th style="padding: 10px;">Rate<br/>INR</th>
                    <th style="padding: 10px;">Rate in<br/>USD</th>
                    <th style="padding: 10px;">Conversion<br/>Rate</th>
                    <th style="padding: 10px;">Batch<br/>size</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 10px;">${sheet.productname || sheet.name || '-'}</td>
                    <td style="padding: 10px;">${mailData.costingID || '-'}</td>
                    <td style="padding: 10px;">${item?.packtype || '-'}</td>
                    <td style="padding: 10px; white-space: nowrap;">₹ ${item?.api != null ? item.api : '0.00'}</td>
                    <td style="padding: 10px; white-space: nowrap;">₹ ${item?.rupee != null ? (+item.rupee).toFixed(2) : '0.00'}</td>
                    <td style="padding: 10px; white-space: nowrap;">$ ${item?.doller != null ? (+item.doller).toFixed(2) : '0.00'}</td>
                    <td style="padding: 10px;">${item?.convertrate || '0.00'}</td>
                    <td style="padding: 10px;">${sheet.detailValues?.batch ? Number(sheet.detailValues.batch).toLocaleString('en-IN') : '-'}</td>                
                </tr>
            </tbody>
        </table>
        
        <p>The above rate is for min b.size, if less than min.b.size rate to be revised</p>
        
        <p>If you have any questions or require further assistance, please feel free to contact us</p>
        
        <p style="margin-top: 10px;"><strong>Regards,</strong></p>
        
        ${nodemailers.getEmailSignature()}
      </div>
    `;

        await nodemailers.sendRawMail({
            to: requests.email,
            subject: `Cost Sheet Details – [${mailData.costingID}]`,
            html: emailHtml,
        });
        return res.apiResponse(true, 'Email sent successfully', {});
    } catch (error) {
        console.error('Error sending mail:', error);
        if (req.bodyParams?.sheetID) {
            mailLogs.status = 'Failed';
            var new_history = new Salehistory(mailLogs);
            await new_history.save();
        }
        return res.apiResponse(false, 'Approved and Failed to send email', {});
    }
};


// const DB_NAME = 'Medquantas';
// const HOST = '127.0.0.1';
// const PORT = '27017';
// const BACKUP_DIR = process.env.BACKUP_DIR
// const mongoBinPath = process.env.BACKUP_PATH
// if (!fs.existsSync(BACKUP_DIR)) {
//     fs.mkdirSync(BACKUP_DIR, { recursive: true });
// }
// function backupDatabase() {
//     const date = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
//     const backupFile = path.join(BACKUP_DIR, `${DB_NAME}-backup-${date}.gz`);
//     const escapedBackupFile = `"${backupFile}"`;
//     const command = `"${mongoBinPath}\\mongodump" --host ${HOST} --port ${PORT} --db ${DB_NAME} --archive=${escapedBackupFile} --gzip`;
//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing backup: ${error.message}`);
//             return;
//         }
//         if (stderr) {
//             console.error(`Backup process stderr: ${stderr}`);
//             return;
//         }
//         console.log(`Backup completed successfully: ${backupFile}`);
//     });
// }

// cron.schedule('0 0 * * *', () => {
//     console.log('Starting database backup...');
//     backupDatabase();
// });