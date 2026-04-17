const _ = require("lodash");
const ExcelHelper = require('../helpers/excel_helper')
const ItemMaster = require('../models/item_master');
const BomMaster = require('../models/bom_master');
const PriceMaster = require("../models/price_master");
const Costsheet = require("../models/costsheet");
const Packtype = require("../models/packtype");
const ErrorLog = require("../models/error");
const ConversionFactor = require("../models/conversionFactor");
const ErbBom = require("../models/erb_bom")
const ErbRate = require("../models/erb_rate")
const ErbItem = require("../models/erb_item")
const Itemtype = require("../models/itemtype")


// item *****************************************************

exports.get_item_data_format = async (worksheet_price) => {
    return new Promise((resolve, reject) => {
        try {
            let comman_data = [];
            let item_header = [];
            if (typeof worksheet_price?.getRow === 'function') {
                worksheet_price.getRow(1).eachCell((cell, colNumber) => {
                    item_header.push(cell.text || cell.value);
                });

                const totalRows = worksheet_price.actualRowCount;
                for (let i = 2; i <= totalRows; i++) {
                    let row = worksheet_price.getRow(i);
                    let _original_price_record = {};

                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_item_header(item_header[j]);
                        let cellValue = row.getCell(j + 1).value;
                        _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                    }

                    if (_original_price_record.name && _original_price_record.name !== '') {
                        comman_data.push(_original_price_record);
                    }
                }
            } else if (Array.isArray(worksheet_price)) {
                item_header = Object.keys(worksheet_price[0]).map(header => _.trim(header));
                for (let i = 0; i < worksheet_price.length; i++) {
                    let row = worksheet_price[i];
                    let _original_price_record = {};
                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_item_header(item_header[j]);
                        if (headerKey !== item_header[j]) {
                            let cellValue = row[item_header[j]];
                            _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                        }
                    }
                    comman_data.push(_original_price_record);
                }
            } else {
                throw new Error("Unsupported data format");
            }
            return resolve(comman_data);
        } catch (error) {
            console.log("get_gst_data_format -> error", error);
            return reject([]);
        }
    });
};

exports.update_item_data = async (data) => {
    return new Promise(async function (resolve, reject) {
        if (Array.isArray(data)) {
            console.error('Expected data to be an object but found an array:', data);
            return reject(false);
        }
        try {
            const new_item = await ItemMaster.findOneAndUpdate(
                { code: data.code },
                { $set: data },
                { new: true, upsert: true }
            );

            if (new_item) {
                if (data.typeCode) {
                    const exist_type = await Itemtype.findOne({ code: data.typeCode });
                    if (!exist_type) {
                        const new_type = new Itemtype({ code: data.typeCode, name: data.typeCode });
                        await new_type.save();
                    }
                }

                var new_erb = new ErbItem({
                    code: data.code,
                    name: data.name,
                    type: data.typeCode,
                    subtype: data.subtypeCode,
                    buyunit: data.buyUnit,
                    convertUnit: data.convertUnit,
                });
                await new_erb.save()
                const existing_price = await PriceMaster.findOne({ code: new_item.code });
                if (!existing_price) {
                    const priceData = {
                        itemID: new_item._id,
                        code: new_item.code,
                        name: new_item.name,
                        rate: 0,
                        grnRate: 0,
                        gst: 0,
                        gstCGST: 0,
                        gstSGST: 0,
                    };
                    const new_rate = new PriceMaster(priceData);
                    await new_rate.save();
                }
                return resolve(true);
            } else {
                console.error('Item not found or could not be updated');
                return resolve(false);
            }
        } catch (error) {
            console.error("update_item_data -> error", error);
            return reject(false);
        }
    });
};


// bom *****************************************************


exports.get_bom_data_format = async (worksheet_price) => {
    return new Promise((resolve, reject) => {
        try {
            let comman_data = [];
            let item_header = [];

            if (typeof worksheet_price?.getRow === 'function') {
                worksheet_price.getRow(1).eachCell((cell, colNumber) => {
                    item_header.push(cell.text || cell.value);
                });

                const totalRows = worksheet_price.actualRowCount;
                for (let i = 2; i <= totalRows; i++) {
                    let row = worksheet_price.getRow(i);
                    let _original_price_record = {};

                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_bom_header(item_header[j]);
                        let cellValue = row.getCell(j + 1).value;
                        _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                    }

                    if (_original_price_record.code || _original_price_record.bomName) {
                        comman_data.push(_original_price_record);
                    }
                }
            } else if (Array.isArray(worksheet_price)) {
                item_header = Object.keys(worksheet_price[0]).map(header => _.trim(header));
                for (let i = 0; i < worksheet_price.length; i++) {
                    let row = worksheet_price[i];
                    let _original_price_record = {};
                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_bom_header(item_header[j]);
                        if (headerKey !== item_header[j]) {
                            let cellValue = row[item_header[j]];
                            _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                        }
                    }
                    comman_data.push(_original_price_record);
                }
            } else {
                throw new Error("Unsupported data format");
            }
            return resolve(comman_data);
        } catch (error) {
            console.log("get_gst_data_format -> error", error);
            return reject([]);
        }
    });
};

exports.update_bom_data = async (data, skipCostSheet = false) => {
    return new Promise(async function (resolve, reject) {
        try {

            let item = await ItemMaster.findOne({ code: data.itemCode });
            if (item && item.typeCode === 'IM') {
                return resolve(true);
            }
            if (!item) {
                return reject(new Error("Item not found"));
            }
            console.log(data)

            const exist_bom = await BomMaster.findOne({ code: data.bomCode, locCd: data.locCode });
            const pack = await Packtype.findOne({ code: data.stageCode });

            const baseStandQty = !pack ? (data.totalStandQty ?? data.standQty) : data.standQty;
            const baseRequestQty = !pack ? (data.totalReqQty ?? data.requestQty) : data.requestQty;

            const percentageValue = Number(item.percentage) || 0;
            const resolvedStandQty = percentageValue > 0 ? (Number(baseStandQty) + (Number(baseStandQty) * (percentageValue / 100))).toFixed(3) : baseStandQty;
            const resolvedRequestQty = percentageValue > 0 ? (Number(baseRequestQty) + (Number(baseRequestQty) * (percentageValue / 100))).toFixed(3) : baseRequestQty;
            let hasChanged = false;
            if (exist_bom) {
                if (pack) {
                    const packStage = exist_bom.packstage.find(
                        (stage) => stage.stageCode === data.stageCode && stage.fgCode === data.fgCode
                    );
                    if (packStage) {
                        packStage.fgSubtype = data.fgSubtype || packStage.fgSubtype;
                        const existingIngredient = packStage.ingredients.find(
                            (ingredient) => ingredient.code === data.itemCode
                        );
                        if (existingIngredient) {
                            if (existingIngredient.standQty != resolvedStandQty || existingIngredient.requestQty != resolvedRequestQty || existingIngredient.percentage != percentageValue) {
                                hasChanged = true;
                            }
                        } else {
                            hasChanged = true;
                        }
                    } else {
                        hasChanged = true;
                    }
                } else {
                    const existingIngredient = exist_bom.bomraw.find(item => item.code === data.itemCode);
                    if (existingIngredient) {
                        if (existingIngredient.standQty != resolvedStandQty || existingIngredient.requestQty != resolvedRequestQty || existingIngredient.percentage != percentageValue) {
                            hasChanged = true;
                        }
                    } else {
                        hasChanged = true;
                    }
                }
            } else {
                hasChanged = true;
            }

            if (!hasChanged) {
                console.log(`Skipping BOM update for item ${data.itemCode} in BOM ${data.bomCode} (No change)`);
                return resolve(true);
            }

            var new_erb = new ErbBom({
                code: data.itemCode,
                bomcode: data.bomCode,
                itemname: data.itemName,
                bomname: data.bomName,
                requestQty: data.requestQty,
                fgCode: data.fgCode,
                fgName: data.fgName,
                itemType: item.typeCode,
            });
            await new_erb.save()

            item = {
                ...item.toObject(),
                originalStandQty: baseStandQty,
                originalRequestQty: baseRequestQty,
                standQty: resolvedStandQty,
                requestQty: resolvedRequestQty,
                percentage: percentageValue
            };

            if (exist_bom) {
                if (pack) {
                    const packStageExists = exist_bom.packstage.some(
                        (stage) => stage.stageCode === data.stageCode && stage.fgCode === data.fgCode
                    );
                    if (packStageExists) {
                        const packStage = exist_bom.packstage.find(
                            (stage) => stage.stageCode === data.stageCode && stage.fgCode === data.fgCode
                        );
                        const itemExists = packStage.ingredients.some(
                            (ingredient) => ingredient.code === data.itemCode
                        );
                        if (itemExists) {
                            const ingredientIndex = packStage.ingredients.findIndex(
                                (ingredient) => ingredient.code === data.itemCode
                            );
                            packStage.ingredients[ingredientIndex] = {
                                ...packStage.ingredients[ingredientIndex],
                                ...item
                            };

                            const updated_bom = await BomMaster.findOneAndUpdate(
                                { code: data.bomCode, locCd: data.locCode },
                                { $set: { packstage: exist_bom.packstage } },
                                { new: true }
                            );
                        }
                        else {
                            for (let d of exist_bom.packstage) {
                                if (d.stageCode === packStage.stageCode && d.fgCode === packStage.fgCode) {
                                    d.ingredients.push(item);
                                    break;
                                }
                            }
                            const new_item = await BomMaster.findOneAndUpdate(
                                { code: data.bomCode, locCd: data.locCode },
                                { $set: { packstage: exist_bom.packstage } },
                                { new: true }
                            );
                        }
                    }
                    else {
                        const newPackStage = {
                            stageCode: data.stageCode,
                            stageName: data.stageName || '',
                            fgName: data.fgName || '',
                            fgCode: data.fgCode,
                            fgSubtype: data.fgSubtype || '',
                            packID: pack?.id,
                            ingredients: [item],
                            percentage: 2,
                        };
                        await BomMaster.findOneAndUpdate(
                            { code: data.bomCode, locCd: data.locCode },
                            { $push: { packstage: newPackStage } },
                            { new: true, upsert: false }
                        );
                    }
                }
                else {
                    const rawStageIndex = exist_bom.bomraw.findIndex(item => item.code === data.itemCode);
                    if (rawStageIndex !== -1) {
                        exist_bom.bomraw[rawStageIndex] = {
                            ...exist_bom.bomraw[rawStageIndex],
                            standQty: resolvedStandQty,
                            requestQty: resolvedRequestQty
                        };
                    } else {
                        exist_bom.bomraw.push(item);
                    }
                    await exist_bom.save();
                }
                if (!skipCostSheet) update_cost_Sheet(data.bomCode, data.locCode);
            } else {
                const newRawStage = {
                    stageCode: data.stageCode,
                    stageName: data.stageName,
                    fgName: data.fgName,
                    fgCode: data.fgCode,
                    ingredients: [item]
                };

                const newPackStage = {
                    stageCode: data.stageCode,
                    stageName: data.stageName,
                    fgName: data.fgName,
                    fgCode: data.fgCode,
                    fgSubtype: data.fgSubtype || '',
                    packID: pack?.id,
                    ingredients: [item],
                    percentage: 2,
                };

                const new_bom = new BomMaster({
                    status: 'Pending',
                    revision: '1',
                    name: data.bomName,
                    code: data.bomCode,
                    locCd: data.locCode,
                    bomraw: pack ? [] : [item],
                    rawstage: pack ? [] : [newRawStage],
                    packstage: pack ? [newPackStage] : []
                });
                await new_bom.save();
            }
            return resolve(true);
        } catch (error) {
            console.log("update_bom_data -> error", error);
            return reject(false);
        }
    });
};

exports.update_bom_percentage_bulk = async (data) => {
    return new Promise(async function (resolve, reject) {
        try {
            const { code, percentage } = data;
            const percentageValue = parseFloat(percentage) || 0;

            // 1. Update ItemMaster
            const updatedItem = await ItemMaster.findOneAndUpdate(
                { code: code },
                { $set: { percentage: percentageValue } },
                { new: true }
            );

            if (!updatedItem) {
                console.log(`Item with code ${code} not found in ItemMaster`);
                return resolve(false);
            }

            // 2. Find all BOMs containing this item
            const boms = await BomMaster.find({
                $or: [
                    { "bomraw.code": code },
                    { "rawstage.ingredients.code": code },
                    { "packstage.ingredients.code": code }
                ]
            });

            if (boms.length === 0) {
                console.log(`No BOMs found containing item code ${code}`);
                return resolve(true);
            }

            for (let bom of boms) {
                let bomModified = false;

                const updateIngredients = (ingredients) => {
                    let modified = false;
                    for (let item of ingredients) {
                        if (item.code === code) {
                            // Ensure original quantities are preserved
                            if (!item.originalStandQty && item.standQty) {
                                item.originalStandQty = parseFloat(item.standQty);
                            }
                            if (!item.originalRequestQty && item.requestQty) {
                                item.originalRequestQty = parseFloat(item.requestQty);
                            }

                            // Update standQty and requestQty based on original ones
                            if (item.originalStandQty) {
                                item.standQty = (item.originalStandQty + (item.originalStandQty * (percentageValue / 100))).toFixed(3);
                            }
                            if (item.originalRequestQty) {
                                item.requestQty = (item.originalRequestQty + (item.originalRequestQty * (percentageValue / 100))).toFixed(3);
                            }
                            item.percentage = percentageValue;
                            modified = true;
                        }
                    }
                    return modified;
                };

                // Update bomraw
                if (bom.bomraw && bom.bomraw.length > 0) {
                    if (updateIngredients(bom.bomraw)) bomModified = true;
                }

                // Update rawstage
                if (bom.rawstage && bom.rawstage.length > 0) {
                    for (let stage of bom.rawstage) {
                        if (stage.ingredients && updateIngredients(stage.ingredients)) bomModified = true;
                    }
                }

                // Update packstage
                if (bom.packstage && bom.packstage.length > 0) {
                    for (let stage of bom.packstage) {
                        if (stage.ingredients && updateIngredients(stage.ingredients)) bomModified = true;
                    }
                }

                if (bomModified) {
                    await BomMaster.findOneAndUpdate({ _id: bom._id }, {
                        $set: {
                            bomraw: bom.bomraw,
                            rawstage: bom.rawstage,
                            packstage: bom.packstage
                        }
                    });
                    // 3. Trigger CostSheet update
                    await update_cost_Sheet(bom.code, bom.locCd);
                }
            }

            return resolve(true);
        } catch (error) {
            console.error("update_bom_percentage_bulk -> error", error);
            return reject(false);
        }
    });
};


exports.update_cost_Sheet = async function (code, locCd) {
    try {
        const bomQuery = locCd ? { code: code, locCd: locCd } : { code: code };
        const updatedBomDoc = await BomMaster.findOne(bomQuery);
        console.log("update_cost_Sheet -> updatedBomDoc", code, "locCd:", locCd);
        if (!updatedBomDoc) return;
        const updatedBom = JSON.parse(JSON.stringify(updatedBomDoc));

        async function applyPercentage(items) {
            if (!items || !Array.isArray(items)) return items;
            const codes = items.map(i => i.code);
            const itemsData = await ItemMaster.find({ code: { $in: codes } }, "code percentage").lean();
            const map = new Map();
            itemsData.forEach(i => map.set(i.code, Number(i.percentage) || 0));

            return items.map(item => {
                const percentageValue = map.get(item.code) || 0;
                if (percentageValue > 0) {
                    if (item.requestQty && (item.originalRequestQty === undefined || item.originalRequestQty === null)) {
                        item.originalRequestQty = Number(item.requestQty);
                    }
                    if (item.standQty && (item.originalStandQty === undefined || item.originalStandQty === null)) {
                        item.originalStandQty = Number(item.standQty);
                    }

                    const origReq = Number(item.originalRequestQty);
                    const origStand = Number(item.originalStandQty);

                    if (!isNaN(origReq)) {
                        item.requestQty = (origReq + (origReq * (percentageValue / 100))).toFixed(3);
                    }
                    if (!isNaN(origStand)) {
                        item.standQty = (origStand + (origStand * (percentageValue / 100))).toFixed(3);
                    }
                }
                item.percentage = percentageValue;
                return item;
            });
        }

        if (updatedBom.bomraw) updatedBom.bomraw = await applyPercentage(updatedBom.bomraw);
        if (updatedBom.rawstage) {
            for (let stage of updatedBom.rawstage) {
                stage.ingredients = await applyPercentage(stage.ingredients);
            }
        }
        if (updatedBom.packstage) {
            for (let stage of updatedBom.packstage) {
                stage.ingredients = await applyPercentage(stage.ingredients);
            }
        }

        for (let pack of updatedBom?.packstage || []) {
            if (!pack.bomDetail) continue;

            const requiredFields = ['batch', 'costunit', 'manufacture_qty', 'manufacture_total'];
            let hasAllFields = true;
            for (const field of requiredFields) {
                if (pack.bomDetail[field] === undefined || pack.bomDetail[field] === null || pack.bomDetail[field] === '') {
                    hasAllFields = false;
                    break;
                }
            }
            if (!hasAllFields) continue;

            const factors = await ConversionFactor.find();

            let sheet = {}
            const productYield = pack.bomDetail?.yield || 97.7;
            const costunit = pack.bomDetail.costunit;
            const manufacture_qty = pack.bomDetail.manufacture_qty;
            const manufacture_total = pack.bomDetail.manufacture_total;
            const manufacture_matval = pack.bomDetail.manufacture_matval || 2;
            const freight = pack.bomDetail.freight || 2;
            const pack_qty = pack.bomDetail.pack_qty || 100000;
            const pack_total = pack.bomDetail.pack_total || 0.3;
            const pack_matval = pack.bomDetail.pack_matval || 2;
            const analytical_value = pack.bomDetail.analytical_value || 3000;
            const punch_value = pack.bomDetail.punch_value || 2500;
            const convertrate = Number(factors[0]?.inrToUsd) || 81;
            const subtypesToUsePackQty = ['MP1-DRYSRP', 'CNP-DRYSRP', 'MP1-DRY'];
            const usePackQty = subtypesToUsePackQty.includes(pack.fgSubtype);

            const detailValues = {
                batch: pack.bomDetail?.batch,
                yield: productYield,
                costunit: costunit,
                yieldvalue: usePackQty
                    ? Number(pack.bomDetail?.pack_qty) * (Number(productYield) / 100)
                    : Number(pack.bomDetail?.batch) * (Number(productYield) / 100),
                fgSubtype: pack.fgSubtype || '',
                manufacture_qty: manufacture_qty,
                manufacture_total: manufacture_total,
                manufacture_matval: manufacture_matval,
                pack_qty: pack_qty,
                pack_total: pack_total,
                pack_matval: pack_matval,
                analytical_value: analytical_value,
                punch_value: punch_value,
                freight: freight,
                percentage: pack.bomDetail.percentage || 2,
            }
            sheet.detailValues = detailValues
            sheet.medo_raw = await updateRawPrice(updatedBom.bomraw, detailValues)
            sheet.medo_pack = await updatePackPrice(pack, detailValues)
            sheet.name = updatedBom.name
            sheet.code = updatedBom.code
            sheet.productcode = pack.fgCode
            sheet.productname = pack.fgName
            sheet.packID = pack.packID
            sheet.locCd = updatedBom.locCd || locCd || ''
            sheet.system_raw = await updateSystemRawPrice(updatedBom.bomraw, detailValues)
            sheet.system_pack = await updateSystemPackPrice(pack, detailValues)
            sheet.percentage = await calculatePercentage(sheet.medo_raw, sheet.medo_pack, detailValues, sheet.system_pack, sheet.system_raw)
            sheet.system = await systemPrice(sheet, convertrate, pack);
            sheet.medopharm = await medopharmPrice(sheet, convertrate, pack);
            const costQuery = locCd
                ? { productcode: pack.fgCode, locCd: locCd }
                : { productcode: pack.fgCode };
            const updatedCostSheet = await Costsheet.findOne(costQuery);
            if (updatedCostSheet) {
                await Costsheet.findOneAndUpdate(costQuery, { $set: sheet }, { new: true, upsert: true });
            }
            else {
                sheet.status = 'Pending'
                sheet.revision = '1'
                const newSheet = new Costsheet(sheet);
                await newSheet.save();
            }
        }
    } catch (error) {
        console.error("update_cost_Sheet -> error", error);
        throw new Error("Failed to update or create CostSheet");
    }
}

async function updateRawPrice(rawData, detailValues) {
    try {
        const medo_raw = await Promise.all(rawData.map(async (data) => {
            const priceData = await PriceMaster.findOne({ code: data.code });
            if (priceData) {
                data.rate = Number(priceData?.rate) || 0;
                data.gst = Number(priceData?.gst) || 0;
                data.grnRate = Number(priceData?.grnRate) || 0;
                data.prevrate = Number(priceData?.prevrate) || 0;
                data.prevGrnrate = Number(priceData?.prevGrnrate) || 0;
                data.basicUpdatedate = priceData?.basicUpdatedate || 0;
                data.grnUpdatedate = priceData?.grnUpdatedate || 0;
                await updatePrice(data, detailValues);
                return data;
            }
            return null;
        }));
        return medo_raw.filter(item => item !== null);
    } catch (error) {
        console.error("update_cost_Sheet -> error", error);
        throw new Error("Failed to update or create CostSheet");
    }
}

async function updateSystemRawPrice(rawstageData, detailValues) {
    try {
        let masterRawList = [];
        if (rawstageData && rawstageData.length) {
            if (rawstageData[0].ingredients) {
                masterRawList = rawstageData.flatMap(stage => stage.ingredients || []);
            } else {
                masterRawList = rawstageData;
            }
        }
        masterRawList = masterRawList.filter(item => item && item.typeCode !== 'IM');
        const map = new Map();
        masterRawList.forEach(item => {
            const code = item.code?.trim();
            const qty = parseFloat(item.standQty) || 0;
            if (map.has(code)) {
                const existing = map.get(code);
                existing.standQty = (parseFloat(existing.standQty) + qty).toFixed(3);
            } else {
                map.set(code, JSON.parse(JSON.stringify(item)));
            }
        });
        const uniqueRawstage = Array.from(map.values());
        masterRawList = [...uniqueRawstage];
        const system_raw = await Promise.all(masterRawList.map(async (data) => {
            const priceData = await PriceMaster.findOne({ code: data.code });
            if (priceData) {
                data.rate = Number(priceData?.grnRate) || 0;
                data.grnRate = Number(priceData?.grnRate) || 0;
                data.gst = Number(priceData?.gst) || 0;
                data.prevrate = Number(priceData?.prevrate) || 0;
                data.prevGrnrate = Number(priceData?.prevGrnrate) || 0;
                data.basicUpdatedate = priceData?.basicUpdatedate;
                data.grnUpdatedate = priceData?.grnUpdatedate;
                await updatePrice(data, detailValues);
                return data;
            }
            return null;
        }));
        return system_raw.filter(item => item !== null);
    } catch (error) {
        console.error("update_cost_Sheet -> error", error);
        throw new Error("Failed to update or create CostSheet");
    }
}


async function updatePackPrice(packstageData, detailValues) {
    try {
        let masterPackList = [];
        if (packstageData?.ingredients?.length) {
            masterPackList = packstageData.ingredients;
        }
        masterPackList = masterPackList.filter(item => item.typeCode !== 'IM');
        const map = new Map();
        masterPackList.forEach(item => {
            const code = item.code?.trim();
            const qty = parseFloat(item.standQty) || 0;
            if (map.has(code)) {
                const existing = map.get(code);
                existing.standQty = (parseFloat(existing.standQty) + qty).toFixed(3);
            } else {
                map.set(code, JSON.parse(JSON.stringify(item)));
            }
        });
        const uniqueRawstage = Array.from(map.values());
        masterPackList = [...uniqueRawstage];
        const medo_pack = await Promise.all(masterPackList.map(async (data) => {
            const priceData = await PriceMaster.findOne({ code: data.code });
            if (priceData) {
                data.rate = Number(priceData?.rate) || 0;
                data.gst = Number(priceData?.gst) || 0;
                data.grnRate = Number(priceData?.grnRate) || 0,
                    data.prevrate = Number(priceData?.prevrate),
                    data.prevGrnrate = Number(priceData?.prevGrnrate),
                    data.basicUpdatedate = priceData?.basicUpdatedate,
                    data.grnUpdatedate = priceData?.grnUpdatedate
                await updatePrice(data, detailValues);
                return data;
            }
        }));
        return medo_pack;
    } catch (error) {
        console.error("update_cost_Sheet -> error", error);
        throw new Error("Failed to update or create CostSheet");
    }
}

async function updateSystemPackPrice(packstageData, detailValues) {
    try {
        let masterPackList = [];
        if (packstageData?.ingredients?.length) {
            masterPackList = packstageData.ingredients;
        }
        masterPackList = masterPackList.filter(item => item.typeCode !== 'IM');
        const map = new Map();
        masterPackList.forEach(item => {
            const code = item.code?.trim();
            const qty = parseFloat(item.standQty) || 0;
            if (map.has(code)) {
                const existing = map.get(code);
                existing.standQty = (parseFloat(existing.standQty) + qty).toFixed(3);
            } else {
                map.set(code, JSON.parse(JSON.stringify(item)));
            }
        });
        const uniqueRawstage = Array.from(map.values());
        masterPackList = [...uniqueRawstage];
        const system_pack = await Promise.all(masterPackList.map(async (data) => {
            const priceData = await PriceMaster.findOne({ code: data.code });
            if (priceData) {
                data.rate = Number(priceData?.grnRate) || 0;
                data.gst = Number(priceData?.gst) || 0;
                data.prevrate = Number(priceData?.prevrate),
                    data.prevGrnrate = Number(priceData?.prevGrnrate),
                    data.basicUpdatedate = priceData?.basicUpdatedate,
                    data.grnUpdatedate = priceData?.grnUpdatedate
                await updatePrice(data, detailValues);
                return data;
            }
        }));
        return system_pack;
    } catch (error) {
        console.error("update_cost_Sheet -> error", error);
        throw new Error("Failed to update or create CostSheet");
    }
}

async function updatePrice(data, detailValues) {
    const factors = await ConversionFactor.find();
    const convertrate = Number(factors[0]?.inrToUsd) || 81;
    const rate = parseFloat(data.rate) || 0;
    const gst = parseFloat(data.gst) || 0;
    const acess = parseFloat(data.acess) || 0;
    const percentage = parseFloat(detailValues.percentage) || 2;
    const requestQty = parseFloat(data.requestQty) || 0;
    const cess = parseFloat(data.cess) || 0;

    // Excise
    data.excise = calculateExcise(rate, gst);
    // CST
    data.cst = calculateCST(rate, data.excise, acess, percentage);

    // Total
    data.total = calculateTotal(rate, data.excise, acess, data.cst);
    // Value
    data.value = calculateValue(requestQty, data.total);
    // Modvat
    data.modvat = calculateModvat(data.excise, cess, requestQty);
    // Net Amount
    data.netamt = calculateNetAmount(data.value, data.modvat);
    // Cost
    data.cost = calculateCost(data.netamt, detailValues.yieldvalue, detailValues.costunit);
    data.convertrate = convertrate;
    return data;
}

// Separate utility functions for each calculation
function calculateExcise(rate, gst) {
    return !isNaN(rate) && !isNaN(gst) ? Number((rate * (gst / 100)).toFixed(3)) : 0;
}

function calculateCST(rate, excise, acess, percentage) {
    return ((rate + parseFloat(excise) + acess) * (percentage / 100)).toFixed(3);
}

function calculateTotal(rate, excise, acess, cst) {
    return (rate + parseFloat(excise) + acess + parseFloat(cst)).toFixed(3);
}

function calculateValue(requestQty, total) {
    return !isNaN(requestQty) && !isNaN(parseFloat(total)) ? (requestQty * parseFloat(total)).toFixed(3) : '0.000';
}

function calculateModvat(excise, cess, requestQty) {
    return !isNaN(parseFloat(excise)) && !isNaN(cess) && !isNaN(requestQty)
        ? ((parseFloat(excise) + cess) * requestQty).toFixed(3)
        : '0.000';
}

function calculateNetAmount(value, modvat) {
    return !isNaN(parseFloat(value)) && !isNaN(parseFloat(modvat))
        ? (parseFloat(value) - parseFloat(modvat)).toFixed(3)
        : '0.000';
}

function calculateCost(netamt, yieldvalue, costunit) {
    if (!isNaN(parseFloat(netamt)) && yieldvalue > 0 && costunit > 0) {
        return (parseFloat(netamt) / (parseFloat(yieldvalue) / parseFloat(costunit))).toFixed(3);
    } else {
        return '0.000';
    }
}

async function calculatePercentage(medo_raw, medo_pack, detailValues, system_pack, system_raw) {
    const percentage = {};

    if (medo_pack && Array.isArray(medo_pack)) {
        const totalPmCost = medo_pack.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
        const totalSystemRmCost = system_pack.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);

        const totalPmNet = medo_pack.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);
        const totalSystemPmNet = system_pack.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);

        percentage['pmcost'] = totalPmCost.toFixed(3);
        percentage['system_pmcost'] = totalSystemRmCost.toFixed(3);
        percentage['packTotalNet'] = totalPmNet.toFixed(3);
        percentage['system_packTotalNet'] = totalSystemPmNet.toFixed(3);
    } else {
        percentage['pmcost'] = '0.000';
        percentage['system_pmcost'] = '0.000';
        percentage['packTotalNet'] = '0.000';
        percentage['system_packTotalNet'] = '0.000';
    }


    if (medo_raw && Array.isArray(medo_raw)) {
        const totalRmCost = medo_raw.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
        const totalSystemRmCost = system_raw.reduce((sum, item) => { return sum + (parseFloat(item.cost) || 0); }, 0);
        const totalRawNet = medo_raw.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);
        const totalSystemRawNet = system_raw.reduce((sum, item) => { return sum + (parseFloat(item.netamt) || 0); }, 0);

        percentage['rmcost'] = totalRmCost.toFixed(3);
        percentage['system_rmcost'] = totalSystemRmCost.toFixed(3);
        percentage['rawTotalNet'] = totalRawNet.toFixed(3);
        percentage['system_rawTotalNet'] = totalSystemRawNet.toFixed(3);
    } else {
        percentage['rmcost'] = '0.000';
        percentage['system_rmcost'] = '0.000';
        percentage['rawTotalNet'] = '0.000';
        percentage['system_rawTotalNet'] = '0.000';
    }

    // for MANUFACTURING
    const yieldValue = parseFloat(detailValues['yieldvalue']) || 1;
    const costUnit = parseFloat(detailValues['costunit']) || 0;
    const manufactureMatval = parseFloat(detailValues['manufacture_matval']) || 0;
    const manufacture_qty = parseFloat(detailValues['manufacture_qty']) || 1;
    const manufacture_total = parseFloat(detailValues['manufacture_total']) || 1;
    detailValues['manufacture_value'] = manufacture_qty * manufacture_total
    detailValues['manufacture_netamt'] = (manufactureMatval * detailValues['manufacture_value']).toFixed(3);
    detailValues['manufacture_cost'] = (detailValues['manufacture_netamt'] / (yieldValue / costUnit)).toFixed(3);

    // for PACKING
    const packQty = parseFloat(detailValues['pack_qty']) || 0;
    const pack_total = parseFloat(detailValues['pack_total']) || 0;
    const packMatval = parseFloat(detailValues['pack_matval']) || 0;
    detailValues['pack_value'] = packQty * pack_total;
    detailValues['pack_netamt'] = packMatval * detailValues['pack_value'];
    detailValues['pack_cost'] = (detailValues['pack_netamt'] / (yieldValue / costUnit)).toFixed(3);

    // for ANALYTICAL CHARGES && PUNCHES
    const analyticalValue = parseFloat(detailValues['analytical_value']) || 0;
    const punchValue = parseFloat(detailValues['punch_value']) || 0;
    detailValues['analytical_cost'] = ((analyticalValue / yieldValue) * costUnit).toFixed(3);
    detailValues['punch_cost'] = ((punchValue / yieldValue) * costUnit).toFixed(3);

    percentage['materialcost'] = (parseFloat(percentage['rmcost']) + parseFloat(percentage['pmcost'])).toFixed(3);
    percentage['system_materialcost'] = (parseFloat(percentage['system_rmcost']) + parseFloat(percentage['system_pmcost'])).toFixed(3);

    percentage['convcost'] = (parseFloat(detailValues['manufacture_cost']) + parseFloat(detailValues['pack_cost'])).toFixed(3);
    percentage['analyticalcost'] = detailValues['analytical_cost'];
    percentage['punchcost'] = detailValues['punch_cost'];
    percentage['freightcost'] = (parseFloat(percentage['materialcost']) * (detailValues['freight'] / 100)).toFixed(3);

    percentage['factorycost'] = [percentage['materialcost'], percentage['convcost'],
    percentage['analyticalcost'], percentage['punchcost'], parseFloat(percentage['freightcost']),
    ].reduce((acc, cost) => acc + parseFloat(cost), 0).toFixed(3);

    percentage['system_factorycost'] = [percentage['system_materialcost'], percentage['convcost'],
    percentage['analyticalcost'], percentage['punchcost'], parseFloat(percentage['freightcost']),
    ].reduce((acc, cost) => acc + parseFloat(cost), 0).toFixed(3);

    percentage['rmcostPercentage'] = parseFloat(((percentage['rmcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['pmcostPercentage'] = parseFloat(((percentage['pmcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['materialcostPercentage'] = parseFloat(((percentage['materialcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['convcostPercentage'] = parseFloat(((percentage['convcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['analyticalcostPercentage'] = parseFloat(((percentage['analyticalcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['punchcostPercentage'] = parseFloat(((percentage['punchcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['freightcostPercentage'] = parseFloat(((percentage['freightcost'] * 100) / percentage['factorycost']).toFixed(3));
    percentage['factorycostPercentage'] = parseFloat(((percentage['factorycost'] * 100) / percentage['factorycost']).toFixed(3));
    return percentage;
}

async function systemPrice(sheet, convertrate, pack) {
    const system = {}
    system['packtype'] = pack.stageName
    system['name'] = pack.fgName
    system['rupee'] = Number(parseFloat(sheet.percentage['system_factorycost']).toFixed(3));
    system['doller'] = Number((parseFloat(sheet.percentage['system_factorycost']) / convertrate).toFixed(3));
    system['convertrate'] = convertrate;
    system['batchsize'] = parseFloat(sheet.detailValues['batch']) / 100000;
    system['api'] = sheet.system_raw?.[0]?.rate || '0.00';
    return system
}

async function medopharmPrice(sheet, convertrate, pack) {
    const medopharm = {}
    medopharm['packtype'] = pack.stageName
    medopharm['name'] = pack.fgName
    medopharm['api'] = sheet.medo_raw?.[0]?.rate || '0.00';
    medopharm['rupee'] = Number(parseFloat(sheet.percentage['factorycost']).toFixed(3));
    medopharm['convertrate'] = convertrate;
    medopharm['doller'] = Number((parseFloat(sheet.percentage['factorycost']) / convertrate).toFixed(3));
    medopharm['batchsize'] = parseFloat(sheet.detailValues['batch']) / 100000;
    return medopharm
}

// gst *****************************************************

exports.get_gst_data_format = async (worksheet_price) => {
    return new Promise((resolve, reject) => {
        try {
            let comman_data = [];
            let item_header = [];
            if (typeof worksheet_price.getRow === 'function') {
                // Handle XLSX data
                worksheet_price.getRow(3).eachCell((cell, colNumber) => {
                    item_header.push(cell.text || cell.value);
                });

                const totalRows = worksheet_price.actualRowCount;
                for (let i = 2; i <= totalRows; i++) {
                    let row = worksheet_price.getRow(i);
                    let _original_price_record = {};

                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_gst_header(item_header[j]);
                        let cellValue = row.getCell(j + 1).value;
                        _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                    }

                    if (_original_price_record.name && _original_price_record.name !== '') {
                        comman_data.push(_original_price_record);
                    }
                }
            } else if (Array.isArray(worksheet_price)) {
                item_header = Object.keys(worksheet_price[0]).map(header => _.trim(header));
                for (let i = 0; i < worksheet_price.length; i++) {
                    let row = worksheet_price[i];
                    let _original_price_record = {};
                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_excel_gst_header(item_header[j]);
                        if (headerKey !== item_header[j]) {
                            let cellValue = row[item_header[j]];
                            _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                        }
                    }
                    comman_data.push(_original_price_record);
                }
            } else {
                throw new Error("Unsupported data format");
            }
            return resolve(comman_data);
        } catch (error) {
            console.log("get_gst_data_format -> error", error);
            return reject([]);
        }
    });
};

exports.update_gst_data = async (data) => {
    return new Promise(async function (resolve, reject) {
        try {
            const rate = await PriceMaster.findOne({ code: data.code })
            if (rate) {
                const numericRate = Number(data.rate);
                const numericConvert = Number(data.conversion_factor) || 1;
                let gstVal = 0;
                if (data.currency === 'INR') {
                    gstVal = Number(data.gst) || 0;
                }
                const newRate = Number((numericRate * numericConvert).toFixed(3));
                const updateObj = {
                    grnRate: newRate,
                    convert: Number(numericConvert.toFixed(3)),
                    currency: data.currency || '',
                    bsrt: numericRate,
                    gst: gstVal,
                    gstCGST: Number((gstVal / 2).toFixed(3)),
                    gstSGST: Number((gstVal / 2).toFixed(3)),
                    grnUpdatedate: data.reb_date ? new Date(data.reb_date) : ''
                };
                const isSameRate = Number(rate.grnRate) === newRate && Number(rate.convert) === updateObj.convert && Number(rate.bsrt) === numericRate && Number(rate.gst) === gstVal && rate.currency === updateObj.currency;
                if (isSameRate) {
                    return resolve(true);
                }
                const newErb = new ErbRate({
                    code: data.code,
                    rate: numericRate,
                    name: rate.name,
                    convert: numericConvert,
                    grnRate: newRate,
                    gst: gstVal,
                    currency: data.currency || '',
                });
                await newErb.save()
                if (Number(rate.grnRate) > 0 && newRate !== Number(rate.grnRate)) {
                    updateObj.prevGrnrate = rate.grnRate;
                }
                await PriceMaster.findOneAndUpdate(
                    { code: data.code },
                    { $set: updateObj },
                    { new: true }
                );
                try {
                    const sheets = await Costsheet.find({ $or: [{ "system_pack.code": rate.code }, { "system_raw.code": rate.code }] });
                    for (const sheet of sheets) {
                        /* ---------- SYSTEM RAW ---------- */
                        const systemRaw = sheet.system_raw?.find(i => i.code === rate.code);
                        const medoRaw = sheet.medo_raw?.find(i => i.code === rate.code);

                        if (systemRaw) {
                            if (medoRaw && Number(systemRaw.rate) > 0 && newRate !== Number(systemRaw.rate)) {
                                medoRaw.prevGrnrate = systemRaw.rate;
                                medoRaw.grnUpdatedate = data.reb_date ? new Date(data.reb_date) : new Date();
                            }
                            systemRaw.rate = newRate;
                            systemRaw.grnRate = newRate;
                            systemRaw.gst = Number(data.gst) || 0;
                            if (medoRaw) {
                                medoRaw.grnRate = newRate;
                                medoRaw.gst = Number(data.gst) || 0;
                                await updatePrice(medoRaw, sheet.detailValues);
                            }
                            const rawResult = await updatePrice(systemRaw, sheet.detailValues);
                            Object.assign(systemRaw, rawResult);
                            sheet.markModified("system_raw");
                            sheet.markModified("medo_raw");
                        }

                        /* ---------- SYSTEM PACK ---------- */
                        const systemPack = sheet.system_pack?.find(i => i.code === rate.code);
                        const medoPack = sheet.medo_pack?.find(i => i.code === rate.code);
                        if (systemPack) {
                            if (medoPack && Number(systemPack.rate) > 0 && newRate !== Number(systemPack.rate)) {
                                medoPack.prevGrnrate = systemPack.rate;
                                medoPack.grnUpdatedate = data.reb_date ? new Date(data.reb_date) : new Date();
                            }
                            systemPack.rate = newRate;
                            systemPack.grnRate = newRate;
                            systemPack.gst = Number(data.gst) || 0;
                            if (medoPack) {
                                medoPack.grnRate = newRate;
                                medoPack.gst = Number(data.gst) || 0;
                                await updatePrice(medoPack, sheet.detailValues);
                            }
                            const packResult = await updatePrice(systemPack, sheet.detailValues);
                            Object.assign(systemPack, packResult);
                            sheet.markModified("system_pack");
                            sheet.markModified("medo_pack");
                        }

                        /* ---------- RECALCULATE ---------- */
                        sheet.percentage = await calculatePercentage(
                            sheet.medo_raw,
                            sheet.medo_pack,
                            sheet.detailValues,
                            sheet.system_pack,
                            sheet.system_raw
                        );

                        const systemFactoryCost = Number(sheet.percentage?.system_factorycost) || 0;
                        sheet.system.rupee = Number(systemFactoryCost.toFixed(3));
                        sheet.system.doller = Number((sheet.system.rupee / Number(sheet.medopharm.convertrate || 1)).toFixed(3));
                        sheet.system.api = sheet.system_raw?.[0]?.rate || '0.00';
                        sheet.markModified("system");
                        await sheet.save();
                    }
                } catch (error) {
                    console.error("update_sheet_item error:", error);
                    throw error;
                }
            }
            return resolve(true);
        } catch (error) {
            console.log("update_gst_data -> error", error);
            return reject(false);
        }
    });
};

exports.get_price_format = async (worksheet_price) => {
    return new Promise((resolve, reject) => {
        try {
            let comman_data = [];
            let item_header = [];
            if (typeof worksheet_price?.getRow === 'function') {
                worksheet_price.getRow(3).eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    item_header.push(_.trim(cell.text || cell.value));
                });
                const totalRows = worksheet_price.actualRowCount;
                for (let i = 4; i <= totalRows; i++) {
                    let row = worksheet_price.getRow(i);
                    let _original_price_record = {};

                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_rate_header(item_header[j]);
                        let cellValue = row.getCell(j + 1).value;
                        _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                    }

                    if (_original_price_record.name && _original_price_record.name !== '') {
                        comman_data.push(_original_price_record);
                    }
                }
            } else if (Array.isArray(worksheet_price)) {
                item_header = Object.keys(worksheet_price[0]).map(header => _.trim(header));
                for (let i = 0; i < worksheet_price.length; i++) {
                    let row = worksheet_price[i];
                    let _original_price_record = {};
                    for (let j = 0; j < item_header.length; j++) {
                        let headerKey = ExcelHelper.get_rate_header(item_header[j]);
                        if (headerKey !== item_header[j]) {
                            let cellValue = row[item_header[j]];
                            _original_price_record[headerKey] = _.trim(cellValue ? cellValue.toString() : '');
                        }
                    }
                    comman_data.push(_original_price_record);
                }
            } else {
                throw new Error("Unsupported data format");
            }
            return resolve(comman_data);
        } catch (error) {
            console.log("get_gst_data_format -> error", error);
            return reject([]);
        }
    });
};

exports.update_price_data = async (data) => {
    return new Promise(async function (resolve, reject) {
        if (Array.isArray(data)) {
            console.error('Expected data to be an object but found an array:', data);
            return reject(false);
        }
        try {
            const new_item = await ItemMaster.findOne({ code: data.code });
            if (new_item) {
                const existing_price = await PriceMaster.findOne({ code: new_item.code });
                const formattedRate = data.rate ? parseFloat(Number(data.rate).toFixed(3)) : 0;
                if (existing_price) {
                    if (Number(data.rate) !== Number(existing_price.rate)) {
                        existing_price.prevrate = Number(existing_price.rate) || 0;
                        existing_price.basicUpdatedate = new Date()
                    }
                    existing_price.rate = formattedRate || 0;
                    let gstVal = 0;
                    if (existing_price.currency === 'INR') {
                        gstVal = Number(data.gst) || 0;
                    }
                    existing_price.gst = gstVal;
                    existing_price.gstCGST = Number((gstVal / 2).toFixed(3));
                    existing_price.gstSGST = Number((gstVal / 2).toFixed(3));
                    await existing_price.save();
                    await exports.update_sheet_price(existing_price);
                }
                return resolve(true);
            } else {
                console.error('Item not found or could not be updated');
                return resolve(false);
            }
        } catch (error) {
            console.error("update_item_data -> error", error);
            return reject(false);
        }
    });
};


exports.get_header_format = async (worksheet_price, type) => {
    return new Promise(async function (resolve, reject) {
        try {
            let comman_data = []
            let sub_header = []
            await worksheet_price.getRow(1).eachCell(async (cell, colNumber) => {
                await sub_header.push(cell.text);
            });
            for (var i = 1; i <= _.size(worksheet_price.getColumn(1).values); i++) {
                let _original_record = {};
                for (var j = 0; j < _.size(sub_header); j++) {
                    _original_record[ExcelHelper.get_cost_detail_header(sub_header[j])] = _.trim(worksheet_price.getRow(i).getCell(j + 1).toString())
                }
                comman_data.push(_original_record);
            }
            return resolve(comman_data);
        }
        catch (error) {
            console.log("functionadd_product_det -> error", error)
            return reject([])
        }
    })
}

exports.saveDetails = async (requests) => {
    return new Promise(async function (resolve, reject) {
        const cleanedData = requests.filter(item => {
            for (const key in item) {
                if (item.hasOwnProperty(key) && (item[key] !== undefined && item[key] !== '')) {
                    return true;
                }
            }
            return false;
        }).map(item => {
            const cleanedItem = {};
            for (const key in item) {
                if (item.hasOwnProperty(key) && item[key] !== undefined && item[key] !== '') {
                    cleanedItem[key] = item[key];
                }
            }
            return cleanedItem;
        });
        for (const data of cleanedData) {
            const rawFreight = Number(String(data.freight || '').replace('%', '').trim());
            let freightValue = data.freight;
            if (!Number.isNaN(rawFreight)) {
                freightValue = rawFreight;
                if (rawFreight > 0 && rawFreight <= 1) {
                    freightValue = rawFreight * 100;
                }
            }

            const bomDetail = {
                analytical_value: data.analytical_value,
                batch: data.batch,
                costunit: data.costunit,
                freight: freightValue,
                manufacture_qty: data.manufacture_qty,
                manufacture_total: data.manufacture_total,
                manufacture_matval: data.manufacture_matval,
                pack_qty: data.pack_qty,
                pack_total: data.pack_total,
                pack_matval: data.pack_matval,
                punch_value: data.punch_value,
                percentage: data.percentage || 2,
            };

            const query = {
                code: data.code,
                'packstage.fgCode': data.productcode
            };
            if (data.locCd) {
                query.locCd = data.locCd;
            }

            const result = await BomMaster.findOneAndUpdate(
                query,
                {
                    $set: {
                        'packstage.$.bomDetail': bomDetail
                    }
                },
                {
                    new: true
                }
            );

            if (!result) {
                console.warn(`BOM or PackStage not found for code: ${data.code}`);
            } else {
                try {
                    await exports.update_cost_Sheet(result.code, result.locCd);
                } catch (updateError) {
                    console.error(`Could not update Costsheet after BOM detail save for code ${data.code}:`, updateError);
                }
            }
        }
        resolve({ status: true, message: "Bom Added Successfully" });
    })
}

exports.update_sheet_item = async (bom) => {
    try {
        for (const pack of bom.packstage || []) {
            if (!pack.fgCode) continue;
            const sheet = await Costsheet.findOne({ productcode: pack.fgCode });
            if (!sheet) continue;
            const details = {
                batch: pack?.bomDetail?.batch,
                percentage: pack?.bomDetail?.percentage,
                yield: '97.7',
                yieldvalue: ['MP1-DRYSRP', 'CNP-DRYSRP', 'MP1-DRY'].includes(pack.fgSubtype)
                    ? Number(pack?.bomDetail?.pack_qty) * (parseFloat('97.7') / 100)
                    : Number(pack?.bomDetail?.batch) * (parseFloat('97.7') / 100),
                analytical_value: pack?.bomDetail?.analytical_value,
                manufacture_value: pack?.bomDetail?.manufacture_value,
                manufacture_netamt: pack?.bomDetail?.manufacture_netamt,
                manufacture_cost: pack?.bomDetail?.manufacture_cost,
                pack_value: pack?.bomDetail?.pack_value,
                pack_netamt: pack?.bomDetail?.pack_netamt,
                pack_cost: pack?.bomDetail?.pack_cost,
                analytical_cost: pack?.bomDetail?.analytical_cost,
                punch_cost: pack?.bomDetail?.punch_cost,
                costunit: pack?.bomDetail?.costunit,
                freight: pack?.bomDetail?.freight,
                manufacture_matval: pack?.bomDetail?.manufacture_matval,
                manufacture_qty: pack?.bomDetail?.manufacture_qty,
                manufacture_total: pack?.bomDetail?.manufacture_total,
                pack_matval: pack?.bomDetail?.pack_matval,
                pack_qty: pack?.bomDetail?.pack_qty,
                pack_total: pack?.bomDetail?.pack_total,
                punch_value: pack?.bomDetail?.punch_value,
                percentage: pack?.bomDetail?.percentage || 2,
            }
            sheet.detailValues = details

            // Remove IM items
            sheet.medo_pack = sheet.medo_pack.filter(i => i.typeCode !== 'IM');
            sheet.system_pack = sheet.system_pack.filter(i => i.typeCode !== 'IM');
            sheet.medo_raw = sheet.medo_raw.filter(i => i.typeCode !== 'IM');
            sheet.system_raw = sheet.system_raw.filter(i => i.typeCode !== 'IM');

            /* ---------------- PACK STAGE ---------------- */
            for (const item of pack.ingredients || []) {
                const existing = sheet.medo_pack.find(i => i.code === item.code);

                if (existing) {
                    if (
                        existing.standQty !== item.standQty ||
                        existing.requestQty !== item.requestQty
                    ) {
                        existing.standQty = Number(item.standQty) || 0;
                        existing.requestQty = Number(item.requestQty) || 0;
                        await updatePrice(existing, sheet.detailValues);

                        const sysItem = sheet.system_pack.find(i => i.code === item.code);
                        if (sysItem) {
                            sysItem.standQty = Number(item.standQty) || 0;
                            sysItem.requestQty = Number(item.requestQty) || 0;
                            await updatePrice(sysItem, sheet.detailValues);
                        }
                    }
                } else {
                    const price = await PriceMaster.findOne({ code: item.code }).lean();

                    const medoItem = {
                        ...item,
                        rate: Number(price?.rate) || 0,
                        grnRate: Number(price?.grnRate) || 0,
                        gst: Number(price?.gst) || 0,
                        prevrate: Number(price?.prevrate),
                        prevGrnrate: Number(price?.prevGrnrate),
                        basicUpdatedate: price?.basicUpdatedate,
                        grnUpdatedate: price?.grnUpdatedate
                    };

                    const systemItem = {
                        ...item,
                        rate: Number(price?.grnRate) || 0,
                        grnRate: Number(price?.grnRate) || 0,
                        gst: Number(price?.gst) || 0,
                        prevrate: Number(price?.prevrate),
                        prevGrnrate: Number(price?.prevGrnrate),
                        basicUpdatedate: price?.basicUpdatedate,
                        grnUpdatedate: price?.grnUpdatedate
                    };

                    sheet.medo_pack.push(
                        await updatePrice(medoItem, sheet.detailValues)
                    );

                    sheet.system_pack.push(
                        await updatePrice(systemItem, sheet.detailValues)
                    );
                }
            }

            /* ---------------- RAW STAGE ---------------- */
            for (const raw of bom.rawstage || []) {
                for (const ingredient of raw.ingredients || []) {
                    if (ingredient.typeCode === 'IM') continue;

                    const existing = sheet.medo_raw.find(i => i.code === ingredient.code);

                    if (existing) {
                        if (existing.standQty !== ingredient.standQty || existing.requestQty !== ingredient.requestQty) {
                            existing.standQty = Number(ingredient.standQty) || 0;
                            existing.requestQty = Number(ingredient.requestQty) || 0;
                            await updatePrice(existing, sheet.detailValues);

                            const sysItem = sheet.system_raw.find(i => i.code === ingredient.code);
                            if (sysItem) {
                                sysItem.standQty = Number(ingredient.standQty) || 0;
                                sysItem.requestQty = Number(ingredient.requestQty) || 0;
                                await updatePrice(sysItem, sheet.detailValues);
                            }
                        }

                    } else {
                        const price = await PriceMaster.findOne({ code: ingredient.code }).lean();

                        const medoItem = {
                            ...ingredient,
                            rate: Number(price?.rate) || 0,
                            grnRate: Number(price?.grnRate) || 0,
                            gst: Number(price?.gst) || 0,
                            prevrate: Number(price?.prevrate),
                            prevGrnrate: Number(price?.prevGrnrate),
                            basicUpdatedate: price?.basicUpdatedate,
                            grnUpdatedate: price?.grnUpdatedate
                        };

                        const systemItem = {
                            ...ingredient,
                            rate: Number(price?.grnRate) || 0,
                            grnRate: Number(price?.grnRate) || 0,
                            gst: Number(price?.gst) || 0,
                            prevrate: Number(price?.prevrate),
                            prevGrnrate: Number(price?.prevGrnrate),
                            basicUpdatedate: price?.basicUpdatedate,
                            grnUpdatedate: price?.grnUpdatedate
                        };

                        sheet.medo_raw.push(
                            await updatePrice(medoItem, sheet.detailValues)
                        );

                        sheet.system_raw.push(
                            await updatePrice(systemItem, sheet.detailValues)
                        );
                    }
                }
            }

            /* ---------------- FINAL CALCULATION ---------------- */
            sheet.percentage = await calculatePercentage(
                sheet.medo_raw,
                sheet.medo_pack,
                sheet.detailValues,
                sheet.system_pack,
                sheet.system_raw
            );

            sheet.system.rupee = Number((+sheet.percentage.system_factorycost).toFixed(3));
            sheet.system.doller = Number((sheet.system.rupee / sheet.medopharm.convertrate).toFixed(3));
            sheet.system.api = sheet.system_raw?.[0]?.rate || '0.00';

            sheet.medopharm.rupee = Number((+sheet.percentage.factorycost).toFixed(3));
            sheet.medopharm.doller = Number((sheet.medopharm.rupee / sheet.medopharm.convertrate).toFixed(3));
            sheet.medopharm.api = sheet.medo_raw?.[0]?.rate || '0.00';

            sheet.markModified('medo_raw');
            sheet.markModified('system_raw');
            sheet.markModified('medo_pack');
            sheet.markModified('system_pack');
            sheet.markModified('system');
            sheet.markModified('medopharm');
            sheet.markModified('detailValues');
            await sheet.save();
        }
        return true;
    } catch (error) {
        console.error("update_sheet_item error:", error);
        throw error;
    }
};

exports.update_sheet_price = async (rate) => {
    try {
        const sheets = await Costsheet.find({ $or: [{ "medo_pack.code": rate.code }, { "medo_raw.code": rate.code }] });
        for (const sheet of sheets) {
            let changed = false;
            // ---------- MEDO PACK ----------
            const medoPack = sheet.medo_pack?.find(i => i.code === rate.code);
            if (medoPack) {
                if (Number(medoPack.rate) > 0 && Number(medoPack.rate) !== Number(rate?.rate)) {
                    medoPack.basicUpdatedate = new Date();
                    medoPack.prevrate = Number(rate?.prevrate);
                }
                medoPack.rate = Number(rate?.rate) ?? 0;
                medoPack.gst = Number(rate?.gst) ?? 0;
                await updatePrice(medoPack, sheet.detailValues);
                sheet.markModified("medo_pack");
            }

            // ---------- SYSTEM PACK ----------
            const systemPack = sheet.system_pack?.find(i => i.code === rate.code);
            if (systemPack) {
                systemPack.rate = Number(rate?.grnRate) ?? 0;
                systemPack.grnRate = Number(rate?.grnRate) ?? 0;
                systemPack.gst = Number(rate?.gst) ?? 0;
                await updatePrice(systemPack, sheet.detailValues);
                sheet.markModified("system_pack");
            }

            // ---------- MEDO RAW ----------
            const medoRaw = sheet.medo_raw?.find(i => i.code === rate.code);
            if (medoRaw) {
                if (Number(medoRaw.rate) > 0 && Number(medoRaw.rate) !== Number(rate?.rate)) {
                    medoRaw.basicUpdatedate = new Date();
                    medoRaw.prevrate = Number(rate?.prevrate);
                }
                medoRaw.rate = Number(rate?.rate) ?? 0;
                medoRaw.gst = Number(rate?.gst) ?? 0;
                await updatePrice(medoRaw, sheet.detailValues);
                sheet.markModified("medo_raw");
            }

            // ---------- SYSTEM RAW ----------
            const systemRaw = sheet.system_raw?.find(i => i.code === rate.code);
            if (systemRaw) {
                systemRaw.rate = Number(rate?.grnRate) ?? 0;
                systemRaw.grnRate = Number(rate?.grnRate) ?? 0;
                systemRaw.gst = Number(rate?.gst) ?? 0;
                await updatePrice(systemRaw, sheet.detailValues);
                sheet.markModified("system_raw");
            }

            // ---------- RECALCULATE ----------
            sheet.percentage = await calculatePercentage(
                sheet.medo_raw,
                sheet.medo_pack,
                sheet.detailValues,
                sheet.system_pack,
                sheet.system_raw
            );

            sheet.system.rupee = Number((+sheet.percentage.system_factorycost).toFixed(3));
            sheet.system.doller = Number((sheet.system.rupee / sheet.medopharm.convertrate).toFixed(3));
            sheet.system.api = sheet.system_raw?.[0]?.rate || '0.00';

            sheet.medopharm.rupee = Number((+sheet.percentage.factorycost).toFixed(3));
            sheet.medopharm.doller = Number((sheet.medopharm.rupee / sheet.medopharm.convertrate).toFixed(3));
            sheet.medopharm.api = sheet.medo_raw?.[0]?.rate || '0.00';

            sheet.markModified("system");
            sheet.markModified("medopharm");

            await sheet.save();
        }

    } catch (error) {
        console.error("update_sheet_item error:", error);
        throw error;
    }
};

exports.update_sheet_factor = async (factor) => {
    try {
        const sheets = await Costsheet.find();
        for (const sheet of sheets) {
            sheet.system.doller = Number((sheet.system.rupee / factor.inrToUsd).toFixed(3));
            sheet.system.convertrate = factor.inrToUsd || '0.000';
            sheet.medopharm.doller = Number((sheet.medopharm.rupee / factor.inrToUsd).toFixed(3));
            sheet.medopharm.convertrate = factor.inrToUsd || '0.00';
            sheet.markModified("system");
            sheet.markModified("medopharm");
            await sheet.save();
        }
    } catch (error) {
        console.error("update_sheet_item error:", error);
        throw error;
    }
};

exports.bulk_update_percentage = async () => {
    try {
        const boms = await BomMaster.find({});
        for (const bom of boms) {
            let changed = false;
            if (bom.packstage && Array.isArray(bom.packstage)) {
                bom.packstage.forEach(pack => {
                    if (pack.bomDetail) {
                        if (pack.bomDetail.percentage === undefined || pack.bomDetail.percentage === null || pack.bomDetail.percentage === '') {
                            pack.bomDetail.percentage = 2;
                            changed = true;
                        }
                    }
                });
            }
            if (!bom.percentage || bom.percentage === "" || bom.percentage === null) {
                bom.percentage = 2;
                changed = true;
            }
            if (changed) {
                await BomMaster.findOneAndUpdate({ _id: bom._id }, { $set: { packstage: bom.packstage, percentage: bom.percentage } });
            }

            // Recalculate CostSheet for this BOM
            console.log(`Recalculating CostSheet for BOM: ${bom.code}`);
            await update_cost_Sheet(bom.code, bom.locCd);
        }
        await Costsheet.updateMany({ "detailValues.percentage": { $exists: false } }, { $set: { "detailValues.percentage": 2 } });
        console.log("✅ Bulk update percentage and recalculation completed");
        return true;
    } catch (error) {
        console.error("bulk_update_percentage -> error", error);
        throw error;
    }
}
