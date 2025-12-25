const mongoose = require('mongoose');

const ElePhaseOneData = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    }
});

const elePhaseOneData = mongoose.model('election-phasethreedata', ElePhaseOneData);

module.exports = elePhaseOneData;
