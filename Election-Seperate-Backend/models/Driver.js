const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    driverName: {
        type: String,
        required: true
    },
    driverMobileNo: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
