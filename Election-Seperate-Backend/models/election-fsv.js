const mongoose = require('mongoose');

const electionFsv = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    AssemblyName: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    Date: {
        type: Date,
        default: Date.now()
    }
});

const ElectionFsv = mongoose.model('election-fsv', electionFsv);

module.exports = ElectionFsv;
