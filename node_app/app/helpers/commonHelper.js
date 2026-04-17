const fs = require("fs");
const env = process.env
const nodemailer = require('nodemailer');


function trimObj(obj) {
    if (!obj || (!Array.isArray(obj) && typeof obj !== 'object')) {
        return obj;
    }
    return Object.keys(obj).reduce(function (acc, key) {
        const trimmedKey = key.trim();
        const trimmedValue = typeof obj[key] === 'string' ? obj[key].trim() : trimObj(obj[key]);
        const capitalizedValue = typeof trimmedValue === 'string'
            ? trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1)
            : trimmedValue;
        acc[trimmedKey] = capitalizedValue;
        return acc;
    }, Array.isArray(obj) ? [] : {});
}

exports.trimObjc = (obj) => {
    return trimObj(obj)
}


function trimLogin(obj) {
    if (!Array.isArray(obj) && typeof obj != 'object') {
        return obj;
    }
    if (obj) {
        return Object.keys(obj).reduce(function (acc, key) {
            acc[key.trim()] = typeof obj[key] == 'string' ? obj[key].trim() : trimObj(obj[key]);
            return acc;
        }, Array.isArray(obj) ? [] : {});
    }

}
exports.trimLogi = (obj) => {
    return trimLogin(obj)
}


exports.trimStr = (obj) => {
    return capitalizeStr(obj);
};

function capitalizeStr(obj, processedObjects = new Set()) {
    if (!obj || (!Array.isArray(obj) && typeof obj !== 'object')) {
        return obj;
    }

    if (processedObjects.has(obj)) {
        return obj;
    }

    processedObjects.add(obj);

    if (typeof obj === 'string') {
        return obj.trim().charAt(0).toUpperCase() + obj.slice(1);
    }

    return Object.keys(obj).reduce(function (acc, key) {
        const trimmedKey = key.trim();
        const trimmedValue = trimObj(obj[key], processedObjects);

        if (typeof trimmedValue === 'string') {
            console.log('Trimming key:', key, 'Value:', obj[key]);
        }

        acc[trimmedKey] = typeof trimmedValue === 'string' ?
            trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1) :
            trimmedValue;

        return acc;
    }, Array.isArray(obj) ? [] : {});
}


exports.prepareUploadFolder = (path) => {
    const pathExist = fs.existsSync(path)
    if (!pathExist) {
        fs.mkdirSync(path, {
            recursive: true
        })
    }
}

exports.siteUrl = () => {
    return "http://localhost:6500";
}

exports.siteName = () => {
    return process.env.APP_NAME;
}

exports.getBaseurl = () => {
    return env.APP_LIVE || 'http://costing.atmedo.in';
}

exports.getLiveurl = () => {
    return env.APP_URL || 'http://costing.atmedo.in';
}

