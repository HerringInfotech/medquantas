const _ = require("lodash");
const fs = require('fs');
const path = require('path');
const util = require('util');
const moment = require("moment");
const ExcelJS = require('exceljs');
const cwd = process.cwd();
const bulk_update_support = require('./bulk_update_support');
const csvParser = require('csv-parser');
const socketIo = require('socket.io');
const Error = require("../models/error");

const commonHelper = require('../helpers/commonHelper');

exports.remove_file_from_folder = async (directory_path) => {
    return new Promise(async function (resolve, reject) {
        try {
            fs.readdir(directory_path, (err, files) => {
                if (err) throw err;
                for (const file of files) {
                    fs.unlink(path.join(directory_path, file), err => {
                        if (err) throw err;
                    });
                }
            });
            return resolve({ status: true })
        } catch (error) {
            return reject({ status: false })
        }
    })
}

exports.price_upload = async (req, res, next) => {
    try {
        var requests = req.bodyParams;
        await this.remove_file_from_folder('price_folder/');
        if (req.files && req.files.file) {
            const media = req.files.file;
            const fileMove = util.promisify(media.mv);
            const folderPath = 'price_folder/';
            const ext = media.name.split('.').pop().toLowerCase();
            commonHelper.prepareUploadFolder(folderPath);
            var fileName = `file_${moment().unix()}.${ext}`;
            const filePath = path.join(folderPath, fileName);
            global.io.emit('price_upload_progress', 1);
            await fileMove(filePath);
            if (ext === 'xlsx') {
                var workbook = new ExcelJS.Workbook();
                try {
                    await workbook.xlsx.readFile(filePath);
                    var worksheet_price = workbook.getWorksheet('Price Master');
                    if (!worksheet_price) {
                        return res.apiResponse(false, "Worksheet 'Price Master' not found", {});
                    }
                    var price_data_format = await bulk_update_support.get_price_format(worksheet_price);
                    const totalRows = price_data_format.length;
                        console.log(price_data_format);
                    for (let i = 0; i < totalRows; i++) {
                        const data = price_data_format[i];
                        try {
                            await bulk_update_support.update_price_data(data);
                            const progress = Math.floor(((i + 1) / totalRows) * 99) + 1;
                            console.log(`Progress: ${progress}%`);
                            global.io.emit('price_upload_progress', progress);
                        } catch (error) {
                            console.log("Error updating item data:", error);
                        }
                    }
                    global.io.emit('price_upload_progress', 100);
                    return res.apiResponse(true, "XLSX uploaded and processed successfully", {});
                } catch (xlsxError) {
                    console.error("Error processing XLSX file:", xlsxError);
                    return res.apiResponse(false, "Error processing XLSX file", {});
                }
            } else {
                return res.apiResponse(false, 'Unsupported file format. Only XLSX and CSV are allowed.');
            }
        } else {
            return res.apiResponse(false, 'No file was uploaded.');
        }
    } catch (error) {
        console.error("Error in gst_upload:", error);
        return res.apiResponse(false, 'Internal server error.');
    }
};

exports.percentage_bom_upload = async (req, res, next) => {
    try {
        await this.remove_file_from_folder('percentage_folder/');
        console.log(req.files)
        if (req.files && req.files.file) {
            const media = req.files.file;
            const fileMove = util.promisify(media.mv);
            const folderPath = 'percentage_folder/';
            const ext = media.name.split('.').pop().toLowerCase();
            commonHelper.prepareUploadFolder(folderPath);
            var fileName = `percentage_${moment().unix()}.${ext}`;
            const filePath = path.join(folderPath, fileName);
            await fileMove(filePath);

            if (ext === 'xlsx') {
                var workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                var worksheet = workbook.getWorksheet(1); // Read first sheet

                let dataToUpdate = [];
                // The headers are: S.No, Type Name, Item Name, Item Code, % of Qty TO BE ADD WITH BOM
                // Assuming headers are on row 1, Item Code is Col 4, Percentage is Col 5
                const totalRows = worksheet.actualRowCount;
                for (let i = 2; i <= totalRows; i++) {
                    let row = worksheet.getRow(i);
                    let itemCode = row.getCell(4).text || row.getCell(4).value; // Item Code
                    let percentage = row.getCell(5).text || row.getCell(5).value; // Percentage

                    if (itemCode && percentage !== undefined && percentage !== null) {
                        dataToUpdate.push({
                            code: _.trim(itemCode.toString()),
                            percentage: _.trim(percentage.toString())
                        });
                    }
                }

                const totalItems = dataToUpdate.length;
                console.log(`Total items to update: ${totalItems}`);
                for (let i = 0; i < totalItems; i++) {
                    const data = dataToUpdate[i];
                    try {
                        await bulk_update_support.update_bom_percentage_bulk(data);
                        const progress = Math.floor(((i + 1) / totalItems) * 100);
                        global.io.emit('percentage_upload_progress', progress);
                    } catch (error) {
                        console.error(`Error updating item ${data.code}:`, error);
                    }
                }

                return res.apiResponse(true, "Percentage update and BOM re-calculation completed successfully", {});
            } else {
                return res.apiResponse(false, 'Unsupported file format. Only XLSX is allowed.');
            }
        } else {
            return res.apiResponse(false, 'No file was uploaded.');
        }
    } catch (error) {
        console.error("Error in percentage_bom_upload:", error);
        return res.apiResponse(false, 'Internal server error.');
    }
};

exports.import_data = async (req, res, next) => {
    try {
        await this.remove_file_from_folder('detail_folder/');
        if (req.files && req.files.file) {
            const media = req.files.file;
            const fileMove = util.promisify(media.mv);
            const folderPath = 'detail_folder/';
            const ext = media.name.split('.').pop().toLowerCase();
            commonHelper.prepareUploadFolder(folderPath);
            const fileName = `detail_${moment().unix()}.${ext}`;
            const filePath = path.join(folderPath, fileName);
            await fileMove(filePath);

            if (ext === 'xlsx') {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                const worksheet = workbook.getWorksheet(1);

                const dataToUpdate = await bulk_update_support.get_bom_data_format(worksheet);
                if (!Array.isArray(dataToUpdate) || dataToUpdate.length === 0) {
                    return res.apiResponse(false, 'No valid BOM rows found in Excel file.', {});
                }

                // Normalize keys for saveDetails
                const normalizedData = dataToUpdate.map((row) => {
                    const obj = { ...row };
                    if (obj.bomCode && !obj.code) obj.code = obj.bomCode;
                    if (obj.productcode && !obj.productcode) obj.productcode = obj.productcode;
                    // Ensure required details exist
                    return obj;
                });

                const result = await bulk_update_support.saveDetails(normalizedData);
                return res.apiResponse(true, 'BOM details imported and bomDetail updated successfully', result);
            }
            return res.apiResponse(false, 'Unsupported file format. Only XLSX is allowed.');
        }
        return res.apiResponse(false, 'No file was uploaded.');
    } catch (error) {
        console.error('Error in import_data:', error);
        return res.apiResponse(false, 'Internal server error.');
    }
};


