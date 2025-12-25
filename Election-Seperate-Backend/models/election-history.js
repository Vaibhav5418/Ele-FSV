const mongoose = require('mongoose');

const electionHistory = new mongoose.Schema({
    deviceId: {
        type: String,
    },
    actionType: {
        type: String,
    },
    location: {
        type: String,
    },
    PSNumber: {
        type: String
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
    },
    installed_status: {
        type: Number,
    },
    remarks: {
        type: String,
    },
    assignedDid: {
        type: String,
    },
    assignedBy: {
        type: String
    },
    realLocation: {
        type: String
    },
    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    psNo: {
        type: String
    },
    boothNo: {
        type: String
    },
    live: {
        type: Number
    },
    flvUrl: {
        type: String,
    },
    lastSeen: {
        type: String,
    },
    status: {
        type: String,
    },
    prourl: {
        type: String,
    },
    streamname: {
        type: String,
    },
    url2: {
        type: String
    },
    name: {
        type: String,
    },
    mobile: {
        type: Number,
    },
    Date: {
        type: Date,
        default: Date.now()
    }
});

const Elehistory = mongoose.model('election-history', electionHistory);

module.exports = Elehistory;
