

exports.get_excel_item_header = (data) => {
    var static_header = {
        'ITEMCD': 'code',
        'ITEMNAME': 'name',
        "ITEMTPCD": 'typeCode',
        'ITSUBTPCD': 'subtypeCode',
        'UOMCD': 'buyUnit',
        'ISSUOMCD': 'convertUnit',
        'CONVFACT': 'convertRate',
        'ITEMCRTDT': 'creditDate',
        'UQCCNVFCT': 'uqcConvertRate',
        'ITEMSYMBOL': 'itemSymbol',
        'GSIND': 'gsind',
        'HSNSACCD': 'hsnCode',
        'STNDRATE': 'rate'
    }
    return static_header[data] || data;
}

exports.get_excel_bom_header = (data) => {
    var static_header = {
        'LOCCD': 'locCd',
        'PRDSTGCD': 'stageCode',
        'BOPPRDCD': 'code',
        'OUTPRDCD': 'productcode',
        'ITEM NAME': 'bomName',
        'STDBTCHQTY': 'batch',
        'STDOUTQTY': 'standQty',
        'Cost Unit': 'costunit',
        'Manufacture Qty': 'manufacture_qty',
        'Manufacture Total': 'manufacture_total',
        'Manufacture ITC': 'manufacture_matval',
        'Pack Qty': 'pack_qty',
        'Pack Total': 'pack_total',
        'Pack ITC': 'pack_matval',
        'Analytical Value': 'analytical_value',
        'Punch Value': 'punch_value',
        'Frieght': 'freight',
        'Percentage': 'percentage',
    }
    return static_header[data] || data;
}


exports.get_excel_gst_header = (data) => {
    var static_header = {

        'BSRT': 'rate',
        'APPPCT06': 'gst',
        'APPPCT07': 'gstCGST',
        'APPPCT08': 'gstSGST',
        'ITEMCD': 'code',



        'STORECD': 'storeCode',
        // 'LOCTPSRS': 'loctpsrs'
        'LOCTPSRS': 'loctpsrs',


        'UOMCD': 'uomCode',
        'ITEMTPCD': 'itemType',
        'ITSUBTPDES': 'itemSubType',
        'GSIND': 'gsi',
        'HSNSACCD': 'hsnCode',

        'MANUFNAME': 'manufacture',

        'ITEMNAME': 'name',

    }
    return static_header[data] || data;
}



exports.get_location_header = (data) => {
    var static_header = {
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_licence_header = (data) => {
    var static_header = {
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_cost_detail_header = (data) => {
    var static_header = {
        'Name': 'name',
        'Code': 'code',
        'Batch': 'batch',
        'Cost Unit': 'costunit',
        'Manufacture Qty': 'manufacture_qty',
        'Manufacture Total': 'manufacture_total',
        'Manufacture ITC': 'manufacture_matval',
        'Pack Qty': 'pack_qty',
        'Pack Total': 'pack_total',
        'Pack ITC': 'pack_matval',
        'Analytical Value': 'analytical_value',
        'Punch Value': 'punch_value',
        'Freight %': 'freight',
        'ProductCode': 'productcode'
    }
    return static_header[data] || data;
}

exports.get_item_header = (data) => {
    var static_header = {
        'Item Type': 'category',
        'Subtype': 'subcategory',
        "SAP Code": 'item_sapcode',
        'Code': 'item_code',
        'Name': 'item_name',
        'Purchase Unit': 'purchaseunit',
        'Conversion Unit': 'conversionunit',
        'Convert Rate': 'convert_rate',
        'Manufacturer/Make': 'make_name',
    }
    return static_header[data] || data;
}

exports.get_rate_header = (data) => {
    var static_header = {
        'Item Name': 'name',
        'Item Code': 'code',
        'Medquantas Price in INR': 'rate',
        'GST %': 'gst',
    }
    return static_header[data] || data;
}

exports.get_customer_header = (data) => {
    var static_header = {
        'Code': 'customer_code',
        'Name': 'name',
        'Type': 'type',
        'Email': 'email',
        'Gstno': 'gst',
        'Address': 'address',
        'City': 'city',
        'State': 'state',
        'SAP Code': 'customer_sapcode'
    }
    return static_header[data] || data;
}

exports.get_customertype_header = (data) => {
    var static_header = {
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_dosage_header = (data) => {
    var static_header = {
        'FG Type': 'fGtype',
        'FG Sub Type': 'subtype',
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_packtype_header = (data) => {
    var static_header = {
        'Code': 'pack_code',
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_FGmaster_header = (data) => {
    var static_header = {
        'Code': 'code',
        'Name': 'name',
        'Customer': 'customer',
        'FG Type': 'fGtype',
        'FG Subtype': 'subtype',
        'FG Packtype': 'fGpacktype',
        'SAP Code': 'fg_sapcode'
    }
    return static_header[data] || data;
}

exports.get_FGSubtype_header = (data) => {
    var static_header = {
        'Name': 'name',
        'FG Type': 'fGtype',
    }
    return static_header[data] || data;
}

exports.get_FGtype_header = (data) => {
    var static_header = {
        'Name': 'name',
    }
    return static_header[data] || data;
}

exports.get_manufacturer_header = (data) => {
    var static_header = {
        'Name': 'name',
        'SAP Code': 'make_sapcode'
    }
    return static_header[data] || data;
}

exports.get_supplier_header = (data) => {
    var static_header = {
        'Code': 'code',
        'Name': 'name',
        'Email': 'email',
        'Mobile': 'mobile',
        'Address': 'address',
        'SAP Code': 'vendor_sapcode'
    }
    return static_header[data] || data;
}

exports.get_excel_type_header = (data) => {
    var static_header = {
        'Type': 'formtype',
        "Location": 'location_name',
        'Licence': 'licence_name',
        'Unit': 'unit_name',
        'FG Type': 'fgtype_name',
        'FG Sub Type': 'fgsubtype_name',
        "Dosage Specification": 'dosage_name',
        'Packing Type': 'packingtype',
        'Item Type': 'itemtype',
        'No of Units': 'nounits'
    }
    return static_header[data] || data;
}


exports.get_detail_header = (data) => {
    var static_header = {
        'Generic Name': 'bomname',
        'Unique Code': 'uniquecode',
        'Location': 'location_name',
        'Batch Size': 'batch',
        'Unit': 'unit_name',
        'Yield%': 'yield',
        'Analytical Charges': 'analytic',
        'DPCO Conversion Cost': 'conversion',
        'Margin%': 'margin',
        'CCPC%': 'ccpcharge',
        'MFG - Relative Humidity': 'mfg',
        'Punch Size': 'punchname'
    }
    return static_header[data] || data;
}

exports.raw_header_data_formate = (data) => {
    var static_header = {
        'Unique Code': 'uniquecode',
        'Item Type': 'type_name',
        'Item Name': 'item_name',
        'Qty / Batch': 'qty',
        'LOD / OA': 'lod',
    }
    return static_header[data] || data;
}

exports.pack_header_data_formate = (data) => {
    var static_header = {
        'Unique Code': 'uniquecode',
        'Packing Type': 'pack_type',
        'No of Units': 'no_unit',
        'DPCO Packing Charges': 'dpco',
        'Item Name': 'item_name',
        'Qty / Batch': 'qty'
    }
    return static_header[data] || data;
}