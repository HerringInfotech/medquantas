const mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate-v2");
var schemaOptions = {
    toObject: {
        virtuals: true,
    },
    toJSON: {
        virtuals: true,
    },
    timestamps: true,
};

const PriceChangeLogSchema = new mongoose.Schema(
    {
        code: String,
        oldRate: String,
        newRate: String,
        itemPOP: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ItemMaster"
        }
    },
    schemaOptions
);
PriceChangeLogSchema.index({ code: 1, createdAt: -1 });
PriceChangeLogSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("PriceChangeLog", PriceChangeLogSchema);