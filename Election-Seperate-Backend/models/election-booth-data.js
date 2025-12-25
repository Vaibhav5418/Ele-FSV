const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    PSNumber: {
        type: Number
    },
    AssemblyName: {
        type: String,
    },
    DistrictCode: {
        type: Number,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    personName: {
        type: String,
    },
    personMobile: {
        type: Number,
        maxlength: 10,
        required: true,
    },
    installed_status: {
        type: Number,
        default: 0,
    },
    remarks: {
        type: String,
    },
    lastSeen: {
        type: String
    },
    Date: {
        type: Date,
        default: Date.now()
    },
    psNo: {
        type: mongoose.Schema.Types.Mixed
    }    
});

const Booth = mongoose.model('election-booth', boothSchema);

module.exports = Booth;
