const mongoose = require('mongoose');

const fstMemberSchema = new mongoose.Schema({
    fstName: {
        type: String,
        required: false,
        default: ''
    },
    fstMobileNo: {
        type: String,
        required: false,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('FstMember', fstMemberSchema);
