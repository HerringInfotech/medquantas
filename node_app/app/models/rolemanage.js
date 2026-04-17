const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
// mongoose.set('useFindAndModify', false);
//create schemaOptions
var schemaOptions = {
    toObject: {
        virtuals: true
    }
    , toJSON: {
        virtuals: true
    },
    timestamps: true
};


/**
 * catagory schema
 */
const rolemanageSchema = new mongoose.Schema({
    role_id: String,
    permission: Array,
    status: Array,
    is_deleted: {
        type: Boolean,
        default: true
    },
}, schemaOptions);

rolemanageSchema.virtual('user', {
    ref: 'Role',
    localField: 'role_id',
    foreignField: '_id',
    justOne: true,
});

rolemanageSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Rolemanage', rolemanageSchema);    