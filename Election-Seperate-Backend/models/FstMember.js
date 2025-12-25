const mongoose = require('mongoose');

const fstMemberSchema = new mongoose.Schema({
    fstName: {
        type: String,
        required: true
    },
    fstMobileNo: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('FstMember', fstMemberSchema);
