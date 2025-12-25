const mongoose = require('mongoose');

const electionReboot = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    assemblyName: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    },
    psNo: {
        type: mongoose.Schema.Types.Mixed
    },
    servername: {
        type: String
    },
    streamname: {
        type: String
    },
    prourl: {
        type: String
    },
    url2: {
        type: String
    }
});

const EleReboot = mongoose.model('election-reboot', electionReboot);

module.exports = EleReboot;
